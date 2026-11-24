export class TranscriptStore {
  #students = new Map();
  #grades = new Map();
  #nextStudentId = 1;

  addStudent(name) {
    const studentName = String(name ?? "").trim();
    if (!studentName) {
      throw new Error("Student name is required");
    }

    const studentID = this.#nextStudentId++;
    this.#students.set(studentID, { studentID, studentName });
    return studentID;
  }

  getStudentIDs(name) {
    const searchName = name === undefined ? undefined : String(name).trim().toLowerCase();
    const matches = [];
    for (const student of this.#students.values()) {
      if (searchName === undefined || student.studentName.toLowerCase() === searchName) {
        matches.push(student.studentID);
      }
    }
    return matches;
  }

  getTranscript(studentID) {
    const student = this.#requireStudent(studentID);
    return {
      student,
      grades: this.#listGrades(studentID),
    };
  }

  deleteStudent(studentID) {
    const parsedID = this.#parseStudentID(studentID);
    if (!this.#students.delete(parsedID)) {
      throw new Error(`Student not found: ${parsedID}`);
    }
    this.#grades.delete(parsedID);
  }

  addGrade(studentID, course, grade) {
    const parsedID = this.#requireStudent(studentID).studentID;
    const { normalizedCourse, numericGrade } = this.#validateCourseAndGrade(course, grade);

    const studentGrades = this.#grades.get(parsedID) ?? new Map();
    if (studentGrades.has(normalizedCourse)) {
      throw new Error(`Grade already exists for course ${normalizedCourse}`);
    }
    studentGrades.set(normalizedCourse, numericGrade);
    this.#grades.set(parsedID, studentGrades);
    return { studentID: parsedID, course: normalizedCourse, grade: numericGrade };
  }

  changeGrade(studentID, course, grade) {
    const parsedID = this.#requireStudent(studentID).studentID;
    const { normalizedCourse, numericGrade } = this.#validateCourseAndGrade(course, grade);

    const studentGrades = this.#grades.get(parsedID);
    if (!studentGrades?.has(normalizedCourse)) {
      throw new Error(`Grade not found for course ${normalizedCourse}`);
    }
    studentGrades.set(normalizedCourse, numericGrade);
    return { studentID: parsedID, course: normalizedCourse, grade: numericGrade };
  }

  getGrade(studentID, course) {
    const parsedID = this.#parseStudentID(studentID);
    return this.#grades.get(parsedID)?.get(this.#normalizeCourse(course));
  }

  #listGrades(studentID) {
    const parsedID = this.#parseStudentID(studentID);
    return [...(this.#grades.get(parsedID)?.entries() ?? [])].map(
      ([course, grade]) => ({ studentID: parsedID, course, grade }),
    );
  }

  #normalizeCourse(course) {
    return String(course ?? "").trim().toUpperCase();
  }

  #validateCourseAndGrade(course, grade) {
    const normalizedCourse = this.#normalizeCourse(course);
    if (!normalizedCourse) {
      throw new Error("Course name is required");
    }
    const numericGrade = Number(grade);
    if (!Number.isInteger(numericGrade) || numericGrade < 0 || numericGrade > 100) {
      throw new Error("Grade must be an integer from 0 to 100");
    }
    return { normalizedCourse, numericGrade };
  }

  #parseStudentID(studentID) {
    const parsedID = Number(studentID);
    if (!Number.isInteger(parsedID) || parsedID <= 0) {
      throw new Error("Student ID must be a positive integer");
    }
    return parsedID;
  }

  #requireStudent(studentID) {
    const parsedID = this.#parseStudentID(studentID);
    const student = this.#students.get(parsedID);
    if (!student) {
      throw new Error(`Student not found: ${parsedID}`);
    }
    return student;
  }
}
