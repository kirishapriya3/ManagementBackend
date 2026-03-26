import express from "express";
import { allocateRoom, createRoom, deallocateRoom, deleteRoom, getRooms, updateRooms, getRoomsByFloor } from "../Controllers/roomController.js";
import { adminOnly, verifyToken } from "../Middlewares/authMiddleware.js";



const router = express.Router();

router.post("/", verifyToken,adminOnly,createRoom);
router.get("/",verifyToken,getRooms);
router.get("/floor/:floor", verifyToken, getRoomsByFloor);
router.put("/:id", verifyToken,adminOnly,updateRooms);
router.delete("/:id", verifyToken,adminOnly,deleteRoom);
router.post("/allocate", verifyToken,adminOnly,allocateRoom);
router.post("/deallocate", verifyToken,adminOnly,deallocateRoom);

export default router;