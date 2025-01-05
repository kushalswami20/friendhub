import express from 'express';
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import userroute from "./routes/user.route.js";
import friendroute from "./routes/friend.route.js";
import mongoose from 'mongoose';

const app = express();

// middleware
app.use(cors({
    origin: ['http://localhost:5173','https://merabestie.com','https://hosteecommerce.vercel.app','https://sellerassignment.vercel.app/'], 
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());


app.use("/user",userroute);
app.use("/friend",friendroute);

const mongourl = "mongodb+srv://admin:test@cluster0.a7h4q.mongodb.net/?retryWrites=true&w=majority&appName=cluster0";
const PORT = process.env.PORT || 3000;
mongoose.connect(mongourl)
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

app.listen(PORT,()=>{
    
    console.log(`Server running at port ${PORT}`);
})