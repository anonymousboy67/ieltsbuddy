import { connectUsersDb, connectContentDb, getUsersConnection, getContentConnection } from "@/lib/mongodb-connections";

// Backward-compatible default: users/auth DB connection.
export default connectUsersDb;
export { connectUsersDb, connectContentDb, getUsersConnection, getContentConnection };
