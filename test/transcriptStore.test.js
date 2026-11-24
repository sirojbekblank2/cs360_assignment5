import assert from "node:assert/strict";
import { beforeEach, describe, test } from "node:test";
import { TranscriptStore } from "../src/transcriptStore.js";

describe("TranscriptStore", () => {
  let store;

  beforeEach(() => {
    store = new TranscriptStore();
  });

  test("adds students and returns their transcripts", () => {
    const studentID = store.addStudent("Ada");

    assert.equal(studentID, 1);
    assert.deepEqual(store.getTranscript(studentID), {
      student: { studentID, studentName: "Ada" },
      grades: [],
    });
  });

  test("adds and changes a course grade", () => {
    const studentID = store.addStudent("Lin");

    assert.deepEqual(store.addGrade(studentID, "cs360", "85"), {
      studentID,
      course: "CS360",
      grade: 85,
    });
    assert.deepEqual(store.changeGrade(studentID, "CS360", 92), {
      studentID,
      course: "CS360",
      grade: 92,
    });
  });

  test("rejects invalid student, course, and grade inputs", () => {
    const studentID = store.addStudent("Noah");

    assert.throws(() => store.addStudent("   "), /Student name is required/);
    assert.throws(() => store.addGrade(studentID, "", 90), /Course name is required/);
    assert.throws(
      () => store.addGrade(studentID, "CS360", 101),
      /Grade must be an integer from 0 to 100/,
    );
  });

  test("supports exact-name lookup and deletion", () => {
    const firstID = store.addStudent("Grace Lee");
    const secondID = store.addStudent("Grace Hall");

    assert.deepEqual(store.getStudentIDs("Grace Lee"), [firstID]);
    store.deleteStudent(secondID);
    assert.deepEqual(store.getStudentIDs(), [firstID]);
    assert.throws(() => store.deleteStudent(secondID), /Student not found/);
  });

  test("BUG-103: name search trims surrounding whitespace and ignores case", () => {
    const graceLee = store.addStudent("Grace Lee");
    store.addStudent("Grace Hall");

    assert.deepEqual(store.getStudentIDs("  grace lee  "), [graceLee]);
    assert.deepEqual(store.getStudentIDs("GRACE LEE"), [graceLee]);
    assert.deepEqual(store.getStudentIDs("\tgRaCe LeE\n"), [graceLee]);
  });

  test("BUG-103: name search keeps the stored display name unchanged", () => {
    const studentID = store.addStudent("Grace Lee");

    assert.deepEqual(store.getStudentIDs(" GRACE LEE "), [studentID]);
    assert.equal(store.getTranscript(studentID).student.studentName, "Grace Lee");
  });

  test("BUG-102: rejects a second grade for the same student and course", () => {
    const studentID = store.addStudent("Lin");
    store.addGrade(studentID, "CS360", 85);

    assert.throws(() => store.addGrade(studentID, " cs360 ", 70), {
      message: "Grade already exists for course CS360",
    });
    assert.equal(store.getGrade(studentID, "CS360"), 85);
  });

  test("BUG-102: changeGrade remains the way to correct a grade", () => {
    const studentID = store.addStudent("Lin");
    store.addGrade(studentID, "CS360", 85);

    assert.deepEqual(store.changeGrade(studentID, "cs360", 70), {
      studentID,
      course: "CS360",
      grade: 70,
    });
    assert.equal(store.getGrade(studentID, "CS360"), 70);
  });

  test("BUG-102: other courses and other students can still be graded", () => {
    const firstID = store.addStudent("Lin");
    const secondID = store.addStudent("Kai");
    store.addGrade(firstID, "CS360", 85);

    assert.deepEqual(store.addGrade(firstID, "MATH101", 77), {
      studentID: firstID,
      course: "MATH101",
      grade: 77,
    });
    assert.deepEqual(store.addGrade(secondID, "CS360", 91), {
      studentID: secondID,
      course: "CS360",
      grade: 91,
    });
  });

  test("BUG-101: deleting a student also removes their stored grades", () => {
    const studentID = store.addStudent("Ada");
    store.addGrade(studentID, "CS360", 90);

    store.deleteStudent(studentID);

    assert.equal(store.getGrade(studentID, "CS360"), undefined);
    assert.throws(() => store.getTranscript(studentID), /Student not found/);
  });
});
