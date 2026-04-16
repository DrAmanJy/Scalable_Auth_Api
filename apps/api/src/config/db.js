import mongoose from 'mongoose';
export async function connectDb() {
  mongoose
    .connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB_NAME,
    })
    .then(() => console.log('Connected to mongodb'))
    .catch((err) => console.log('field to connect to mongodb :', err.message));
}
