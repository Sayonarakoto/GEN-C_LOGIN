/**
 * StudentViewModel - DTO Mapper for Student entity.
 * Converts snake_case database schema fields into clean camelCase JSON objects
 * tailored for frontend tables, lists, and forms.
 */
class StudentViewModel {
  /**
   * Convert a single Mongoose document or plain object to a clean DTO.
   * @param {object} doc 
   * @returns {object|null}
   */
  static toDTO(doc) {
    if (!doc) return null;
    const obj = typeof doc.toObject === 'function' ? doc.toObject() : doc;

    return {
      id: obj._id ? obj._id.toString() : obj.id,
      studentId: obj.student_id || obj.studentId || '',
      fullName: obj.full_name || obj.fullName || '',
      email: obj.email || '',
      department: obj.department || '',
      year: obj.year || '',
      profilePictureUrl: obj.profile_picture_url || obj.profilePictureUrl || '',
      createdAt: obj.created_at || obj.createdAt || null,
      updatedAt: obj.updated_at || obj.updatedAt || null,
    };
  }

  /**
   * Convert an array of student documents into an array of DTOs.
   * @param {Array<object>} docs 
   * @returns {Array<object>}
   */
  static toDTOList(docs = []) {
    if (!Array.isArray(docs)) return [];
    return docs.map((doc) => StudentViewModel.toDTO(doc));
  }
}

module.exports = StudentViewModel;
