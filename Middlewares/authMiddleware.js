import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.status(401).json({message: "Access denied. No token provided."});
    }
    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({message: "Invalid token"});
    }
};

export const adminOnly = (req,res,next) => {
    if(req.user.role !== "admin"){
        return res.status(403).json({message: "Admin access only"});
    }
    next();
}

export const staffOnly = (req,res,next) => {
    if(req.user.role !== "staff"){
        return res.status(403).json({message: "Staff access only"});
    }
    next();
}

export const adminOrStaff = (req,res,next) => {
    if(req.user.role !== "admin" && req.user.role !== "staff"){
        return res.status(403).json({message: "Admin or Staff access only"});
    }
    next();
}

export const residentOnly = (req,res,next) => {
    if(req.user.role !== "resident"){
        return res.status(403).json({message: "Resident access only"});
    }
    next();
}
