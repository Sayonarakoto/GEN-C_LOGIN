require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Student = require('./models/student');

async function migrateDepartments() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/paperlessCampus");
    console.log("Connected to MongoDB.");

    const students = await Student.find({});
    console.log(`Found ${students.length} students to process.`);

    for (const student of students) {
      if (student.department !== student.department.toUpperCase()) {
        const oldDept = student.department;
        student.department = student.department.toUpperCase();
        await student.save();
        console.log(`Updated student ${student.studentId}: ${oldDept} -> ${student.department}`);
      }
    }

    console.log("Migration complete.");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrateDepartments();
