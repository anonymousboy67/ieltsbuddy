import { Resend } from 'resend';
import connectToDatabase from '@/lib/db';
import OTP from '@/models/OTP';

const resend = new Resend(process.env.RESEND_API_KEY);

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const { email, username } = await request.json();

    if (!email || !username) {
      return Response.json(
        { error: 'Email and username are required.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Save OTP to MongoDB (automatically deleted by TTL index)
    await OTP.findOneAndUpdate(
      { email },
      { otp, expiresAt, username: username.toLowerCase().trim() },
      { upsert: true, new: true }
    );



    // 4. Send the email via Resend
    const { error: sendError } = await resend.emails.send({
      from: 'IELTSBuddy <noreply@samip.tech>',
      to: [email],
      subject: 'Your IELTSBuddy Verification Code',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
</head>
<body style="margin:0;padding:0;background-color:#0B0F1A;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0B0F1A;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#12172B;border-radius:16px;border:1px solid #2A3150;">
          <tr>
            <td style="padding:32px 40px;">
              <h2 style="margin:0 0 16px;color:#F8FAFC;font-size:24px;">Verify your email</h2>
              <p style="margin:0 0 24px;color:#94A3B8;font-size:16px;line-height:1.6;">
                Use the code below to complete your IELTSBuddy sign-up. This code expires in 10 minutes.
              </p>
              <div style="background-color:#1E2540;border-radius:12px;padding:24px;text-align:center;">
                <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#6366F1;">${otp}</span>
              </div>
              <p style="margin:24px 0 0;color:#64748B;font-size:14px;">
                If you didn't request this, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    });

    if (sendError) {
      console.error('Resend error:', sendError);
      return Response.json(
        { error: 'Failed to send verification email. Please try again.' },
        { status: 500 }
      );
    }

    return Response.json({ success: true });

  } catch (err) {

    console.error('send-otp error:', err);
    return Response.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
