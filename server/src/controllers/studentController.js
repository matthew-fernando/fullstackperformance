import Student from '../models/Student.js';


async function getStudentsForClass(req, res)
{
    try
    {
        const students = await Student.find({ class_id: req.params.id }).sort({ last_name: 1, first_name: 1 });
        res.json(students);
    }
    catch (error)
    {
        console.error('Error fetching students:', error);
        res.status(500).json({ error: 'Failed to fetch students' });
    }
}

async function createStudent(req, res)
{
    try
    {
        const { student_id, first_name, last_name, section } = req.body;

        if (student_id === undefined || !first_name || !last_name)
        {
            return res.status(400).json({ error: 'student_id, first_name, and last_name are required' });
        }

        const new_student = await Student.create({
            class_id: req.params.id,
            student_id,
            first_name,
            last_name,
            section
        });

        res.status(201).json(new_student);
    }
    catch (error)
    {
        if (error.code === 11000)
        {
            return res.status(409).json({ error: 'A student with this student_id already exists in this class' });
        }

        console.error('Error creating student:', error);
        res.status(500).json({ error: 'Failed to create student' });
    }
}

async function updateStudent(req, res)
{
    try
    {
        const { student_id, first_name, last_name, section } = req.body;

        const student = await Student.findOne({ _id: req.params.studentId, class_id: req.params.id });

        if (!student)
        {
            return res.status(404).json({ error: 'Student not found' });
        }

        if (student_id !== undefined) student.student_id = student_id;
        if (first_name !== undefined) student.first_name = first_name;
        if (last_name !== undefined) student.last_name = last_name;
        if (section !== undefined) student.section = section;

        await student.save();
        res.json(student);
    }
    catch (error)
    {
        if (error.code === 11000)
        {
            return res.status(409).json({ error: 'A student with this student_id already exists in this class' });
        }

        console.error('Error updating student:', error);
        res.status(500).json({ error: 'Failed to update student' });
    }
}

async function deleteStudent(req, res)
{
    try
    {
        const deleted = await Student.findOneAndDelete({ _id: req.params.studentId, class_id: req.params.id });

        if (!deleted)
        {
            return res.status(404).json({ error: 'Student not found' });
        }

        res.json({ success: true });
    }
    catch (error)
    {
        console.error('Error deleting student:', error);
        res.status(500).json({ error: 'Failed to delete student' });
    }
}


export { getStudentsForClass, createStudent, updateStudent, deleteStudent };