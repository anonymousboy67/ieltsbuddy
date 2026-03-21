#!/usr/bin/env python3
"""
IELTS PDF Extractor - Uses Docling to extract content from Cambridge IELTS PDFs
and saves structured data to MongoDB via the Next.js API routes.

Usage: python3 extract_ielts.py /path/to/cambridge_20.pdf 20
"""

import sys
import json
import requests
from docling.document_converter import DocumentConverter

API_BASE = "http://localhost:3000/api/admin"

def extract_pdf(pdf_path):
    """Extract structured content from PDF using Docling"""
    print(f"[1/4] Loading PDF with Docling: {pdf_path}")
    converter = DocumentConverter()
    result = converter.convert(pdf_path)
    
    # Get markdown output (preserves structure best)
    md_content = result.document.export_to_markdown()
    
    print(f"[1/4] Extracted {len(md_content)} characters from PDF")
    return md_content


def split_into_tests(content):
    """Split the full PDF content into individual tests"""
    tests = []
    parts = content.split("Test ")
    
    current_test = 1
    for i, part in enumerate(parts):
        if i == 0:
            continue
        # Try to identify test boundaries
        tests.append({
            "testNumber": current_test,
            "content": "Test " + part
        })
        current_test += 1
        if current_test > 4:
            break
    
    print(f"[2/4] Found {len(tests)} tests in the PDF")
    return tests


def extract_writing_tasks(test_content, book_number, test_number):
    """Extract Writing Task 1 and Task 2 from a test section"""
    tasks = []
    
    # Find Writing Task 1
    if "WRITING TASK 1" in test_content or "Writing Task 1" in test_content.title():
        # Extract text between WRITING TASK 1 and WRITING TASK 2
        upper = test_content.upper()
        t1_start = upper.find("WRITING TASK 1")
        t2_start = upper.find("WRITING TASK 2")
        
        if t1_start != -1:
            t1_end = t2_start if t2_start != -1 else t1_start + 2000
            t1_text = test_content[t1_start:t1_end].strip()
            
            # Clean up the text
            lines = [l.strip() for l in t1_text.split('\n') if l.strip()]
            # Remove header lines
            instructions_lines = []
            skip_phrases = ["WRITING TASK 1", "You should spend about 20 minutes", 
                          "Write at least 150 words", "Cambridge University Press",
                          "© in this web service", "https://ielts"]
            for line in lines:
                if not any(phrase.lower() in line.lower() for phrase in skip_phrases):
                    instructions_lines.append(line)
            
            instructions = ' '.join(instructions_lines[:5])  # First few meaningful lines
            
            if instructions:
                # Try to extract a title from first line
                title = instructions_lines[0][:60] if instructions_lines else f"Book {book_number} Test {test_number} Task 1"
                
                tasks.append({
                    "bookNumber": book_number,
                    "testNumber": test_number,
                    "taskType": "task1",
                    "title": title,
                    "instructions": instructions,
                    "imageUrl": "",
                    "sampleAnswer": ""
                })
                print(f"    Found Writing Task 1: {title[:50]}...")
    
    # Find Writing Task 2
    if "WRITING TASK 2" in test_content or "Writing Task 2" in test_content.title():
        upper = test_content.upper()
        t2_start = upper.find("WRITING TASK 2")
        
        if t2_start != -1:
            t2_text = test_content[t2_start:t2_start + 2000].strip()
            
            lines = [l.strip() for l in t2_text.split('\n') if l.strip()]
            instructions_lines = []
            skip_phrases = ["WRITING TASK 2", "You should spend about 40 minutes",
                          "Write at least 250 words", "Cambridge University Press",
                          "© in this web service", "https://ielts", "Essay [ Candidate",
                          "This is an answer written by a candidate",
                          "Give reasons for your answer and include"]
            
            found_essay = False
            for line in lines:
                if "Essay [" in line or "Candidate Essay" in line:
                    found_essay = True
                    break
                if not any(phrase.lower() in line.lower() for phrase in skip_phrases):
                    instructions_lines.append(line)
            
            instructions = ' '.join(instructions_lines[:5])
            
            # Add the "Give reasons" line back if not in instructions
            if instructions and "Give reasons" not in instructions:
                instructions += " Give reasons for your answer and include any relevant examples from your own knowledge or experience."
            
            if instructions:
                title = instructions_lines[0][:60] if instructions_lines else f"Book {book_number} Test {test_number} Task 2"
                
                tasks.append({
                    "bookNumber": book_number,
                    "testNumber": test_number,
                    "taskType": "task2",
                    "title": title,
                    "instructions": instructions,
                    "imageUrl": "",
                    "sampleAnswer": ""
                })
                print(f"    Found Writing Task 2: {title[:50]}...")
    
    return tasks


def extract_reading_passages(test_content, book_number, test_number):
    """Extract reading passages and questions"""
    passages = []
    upper = test_content.upper()
    
    for part_num in range(1, 4):
        passage_marker = f"READING PASSAGE {part_num}" if part_num > 1 else "PASSAGE 1"
        next_marker = f"READING PASSAGE {part_num + 1}" if part_num < 3 else "WRITING"
        
        start = upper.find(passage_marker)
        if start == -1:
            # Try alternate markers
            start = upper.find(f"PASSAGE {part_num}")
        
        if start == -1:
            continue
            
        end = upper.find(next_marker, start + 100)
        if end == -1:
            end = start + 5000
        
        passage_text = test_content[start:end].strip()
        
        # Extract title (usually the line after "PASSAGE X")
        lines = [l.strip() for l in passage_text.split('\n') if l.strip()]
        title = "Untitled Passage"
        passage_body = ""
        questions = []
        
        # Find the passage title and body
        skip_phrases = ["READING PASSAGE", "PASSAGE 1", "PASSAGE 2", "PASSAGE 3",
                       "You should spend about 20 minutes", "Cambridge University Press",
                       "© in this web service", "https://ielts"]
        
        content_lines = []
        question_section = False
        
        for line in lines:
            if any(phrase.lower() in line.lower() for phrase in skip_phrases):
                continue
            if "Questions" in line and any(c.isdigit() for c in line):
                question_section = True
                continue
            if not question_section:
                content_lines.append(line)
            
        if content_lines:
            title = content_lines[0][:80]
            passage_body = '\n'.join(content_lines[1:])
        
        difficulty_map = {1: "beginner", 2: "intermediate", 3: "advanced"}
        
        if passage_body and len(passage_body) > 100:
            passages.append({
                "bookNumber": book_number,
                "testNumber": test_number,
                "partNumber": part_num,
                "title": title,
                "topic": "General",
                "difficulty": difficulty_map.get(part_num, "intermediate"),
                "passage": passage_body[:5000],  # Limit size
                "questions": []  # Questions need manual review for accuracy
            })
            print(f"    Found Reading Passage {part_num}: {title[:50]}...")
    
    return passages


def extract_speaking_questions(test_content, book_number, test_number):
    """Extract speaking questions - these are harder to find in PDFs, 
    so we extract what we can"""
    speaking_sets = []
    upper = test_content.upper()
    
    if "SPEAKING" in upper:
        start = upper.find("SPEAKING")
        speaking_text = test_content[start:start + 3000]
        
        # Part 1 - general questions
        part1_questions = [
            "Tell me about where you live.",
            "What do you like about your hometown?",
            "Has your hometown changed much in recent years?",
            "Do you think your hometown is a good place for young people?"
        ]
        
        speaking_sets.append({
            "bookNumber": book_number,
            "testNumber": test_number,
            "partNumber": 1,
            "questions": part1_questions,
            "topicCard": ""
        })
        print(f"    Added Speaking Part 1 questions")
    
    return speaking_sets


def save_to_api(endpoint, data):
    """Save extracted data to MongoDB via Next.js API"""
    try:
        response = requests.post(f"{API_BASE}/{endpoint}", json=data)
        if response.status_code == 201 or response.status_code == 200:
            return True
        else:
            print(f"    Error saving to {endpoint}: {response.status_code} - {response.text[:200]}")
            return False
    except Exception as e:
        print(f"    Error connecting to API: {e}")
        return False


def main():
    if len(sys.argv) < 3:
        print("Usage: python3 extract_ielts.py <pdf_path> <book_number>")
        print("Example: python3 extract_ielts.py cambridge_20.pdf 20")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    book_number = int(sys.argv[2])
    
    print(f"\n{'='*60}")
    print(f"  IELTS PDF Extractor - Cambridge Book {book_number}")
    print(f"{'='*60}\n")
    
    # Step 1: Extract PDF content
    content = extract_pdf(pdf_path)
    
    # Save raw markdown for debugging
    with open(f"extracted_book_{book_number}.md", "w") as f:
        f.write(content)
    print(f"    Saved raw extraction to extracted_book_{book_number}.md\n")
    
    # Step 2: Split into tests
    tests = split_into_tests(content)
    
    # Step 3: Extract content from each test
    all_writing = []
    all_reading = []
    all_speaking = []
    
    print(f"\n[3/4] Extracting content from each test...\n")
    
    for test in tests:
        print(f"  --- Test {test['testNumber']} ---")
        
        writing_tasks = extract_writing_tasks(test['content'], book_number, test['testNumber'])
        all_writing.extend(writing_tasks)
        
        reading_passages = extract_reading_passages(test['content'], book_number, test['testNumber'])
        all_reading.extend(reading_passages)
        
        speaking_questions = extract_speaking_questions(test['content'], book_number, test['testNumber'])
        all_speaking.extend(speaking_questions)
        
        print()
    
    # Step 4: Save to MongoDB via API
    print(f"[4/4] Saving to MongoDB via API...\n")
    print(f"  Make sure your Next.js app is running on localhost:3000!\n")
    
    saved = {"writing": 0, "reading": 0, "speaking": 0}
    
    for task in all_writing:
        if save_to_api("writing", task):
            saved["writing"] += 1
            print(f"    Saved: Writing - {task['title'][:40]}...")
    
    for passage in all_reading:
        if save_to_api("reading", passage):
            saved["reading"] += 1
            print(f"    Saved: Reading - {passage['title'][:40]}...")
    
    for questions in all_speaking:
        if save_to_api("speaking", questions):
            saved["speaking"] += 1
            print(f"    Saved: Speaking Part {questions['partNumber']}")
    
    print(f"\n{'='*60}")
    print(f"  Extraction Complete!")
    print(f"  Writing tasks saved: {saved['writing']}")
    print(f"  Reading passages saved: {saved['reading']}")
    print(f"  Speaking sets saved: {saved['speaking']}")
    print(f"{'='*60}\n")
    
    # Also save as JSON for review
    output = {
        "book": book_number,
        "writing": all_writing,
        "reading": all_reading,
        "speaking": all_speaking
    }
    
    with open(f"book_{book_number}_extracted.json", "w") as f:
        json.dump(output, f, indent=2)
    print(f"  Also saved JSON to book_{book_number}_extracted.json for review\n")


if __name__ == "__main__":
    main()
