import express from 'express';
import { getStudentsForClass, createStudent, updateStudent, deleteStudent } from '../controllers/studentController.js';

const router = express.Router({ mergeParams: true });

router.get('/', getStudentsForClass);
router.post('/', createStudent);
router.put('/:studentId', updateStudent);
router.delete('/:studentId', deleteStudent);

export default router;