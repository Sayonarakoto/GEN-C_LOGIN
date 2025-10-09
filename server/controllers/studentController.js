const Student = require('../models/student');

exports.uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const student = await Student.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    student.profilePictureUrl = `/static/uploads/profile-pictures/${req.file.filename}`;
    await student.save();

    res.json({ success: true, filePath: student.profilePictureUrl });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateStudentProfile = async (req, res) => {
    try {
        const { fullName, department, year, email } = req.body;
        const student = await Student.findById(req.user.id);

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found.' });
        }

        student.fullName = fullName;
        student.department = department;
        student.year = year;
        student.email = email;

        await student.save();

        res.json({ success: true, message: 'Profile updated successfully.' });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};