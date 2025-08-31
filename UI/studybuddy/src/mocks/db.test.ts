import { describe, it, expect, beforeEach } from 'vitest';
import { DB } from './db';
import type { Student, Course} from '../types';

// Test suite for the mock database
describe('DB', () => {
  // Before each test, reset the database to ensure a clean state
  beforeEach(() => {
    DB.reset();
    localStorage.clear();
  });

  // --- Authentication and User Management ---
  describe('Authentication', () => {
    it('should create a user and set them as the current user', () => {
      const user = DB.createUser('Eli Monroe', 'eli_monroe');
      expect(user.name).toBe('Eli Monroe');
      const me = DB.me();
      expect(me?.id).toBe(user.id);
    });

    it('should throw an error for duplicate usernames (case-insensitive)', () => {
      DB.createUser('Test User', 'test_user');
      expect(() => DB.createUser('Another User', 'TEST_USER')).toThrow('Username already in use');
    });

    it('should throw an error for invalid username formats', () => {
      expect(() => DB.createUser('User', 'a')).toThrow('Invalid username format');
      expect(() => DB.createUser('User', 'user name')).toThrow('Invalid username format');
    });

    it('should throw an error when logging in with a non-existent user', () => {
      expect(() => DB.login('non_existent_user')).toThrow('User not found');
    });

    it('should log a user out successfully', () => {
      DB.createUser('Test User', 'test_user');
      DB.login('test_user');
      expect(DB.me()).toBeDefined();
      DB.logout();
      expect(DB.me()).toBeUndefined();
    });
  });

  // --- Profile Management ---
  describe('Profile Management', () => {
    it('should get an existing user by username (case-insensitive)', () => {
      const createdUser = DB.createUser('Jane Doe', 'jane_doe');
      const foundUser = DB.getUserByUsername('JANE_DOE');
      expect(foundUser?.id).toBe(createdUser.id);
    });

    it('should return undefined for a non-existent username', () => {
      expect(DB.getUserByUsername('non_existent_user')).toBeUndefined();
    });
  });

  // --- Courses and Enrollments ---
  describe('Courses and Enrollments', () => {
    it('should enroll the current user in a course and create the course if it does not exist', () => {
      const user = DB.createUser('Jane Doe', 'jane_doe');
      DB.login('jane_doe');
      DB.addEnrollment('CPSC 2150-001');
      const myCourses = DB.listMyCourses();
      expect(myCourses).toHaveLength(1);
      expect(myCourses[0].code).toBe('CPSC 2150-001');
    });

    it('should throw an error when adding a course without being logged in', () => {
      expect(() => DB.addEnrollment('CPSC 3720-001')).toThrow('Not logged in');
    });

    it('should throw an error when adding a duplicate course', () => {
      DB.createUser('Test User', 'test_user');
      DB.login('test_user');
      DB.addEnrollment('CPSC 3720-001');
      expect(() => DB.addEnrollment('CPSC 3720-001')).toThrow('Course already added');
    });

    it('should remove an enrollment for the current user', () => {
      DB.createUser('Test User', 'test_user');
      DB.login('test_user');
      DB.addEnrollment('CPSC-101');
      expect(DB.listMyCourses()).toHaveLength(1);
      DB.removeEnrollment('CPSC-101');
      expect(DB.listMyCourses()).toHaveLength(0);
    });

     it('should not affect other users when one user removes an enrollment', () => {
      const user1 = DB.createUser('User One', 'user_one');
      const user2 = DB.createUser('User Two', 'user_two');
      const courseCode = 'SCI-101';

      // Both users enroll
      DB.login('user_one');
      DB.addEnrollment(courseCode);
      DB.logout();
      DB.login('user_two');
      DB.addEnrollment(courseCode);
      
      // User Two removes the course
      DB.removeEnrollment(courseCode);
      expect(DB.listMyCourses()).toHaveLength(0);

      // User One should still be enrolled
      DB.logout();
      DB.login('user_one');
      expect(DB.listMyCourses()).toHaveLength(1);
      expect(DB.listMyCourses()[0].code).toBe(courseCode);
    });
  });

  // --- Availability Management ---
  describe('Availability Management', () => {
    beforeEach(() => {
        DB.createUser('Available User', 'available_user');
        DB.login('available_user');
    });

    it('should add a meeting time to the user profile', () => {
        DB.addMeetingTime("Monday", "10:00", "11:00");
        const user = DB.me();
        expect(user?.availability).toBeDefined();
        expect(user?.availability?.[0]).toEqual({ day: "Monday", startTime: "10:00", endTime: "11:00" });
    });

    it('should not add a duplicate meeting time', () => {
        DB.addMeetingTime("Wednesday", "17:00", "18:00");
        DB.addMeetingTime("Wednesday", "17:00", "18:00"); // Add again
        const user = DB.me();
        expect(user?.availability).toHaveLength(1);
    });

    it('should remove a meeting time from the user profile', () => {
        const time1 = { day: "Friday", startTime: "13:00", endTime: "14:00" };
        const time2 = { day: "Tuesday", startTime: "09:00", endTime: "10:00" };
        DB.addMeetingTime(time1.day, time1.startTime, time1.endTime);
        DB.addMeetingTime(time2.day, time2.startTime, time2.endTime);
        
        DB.removeMeetingTime(time1);

        const user = DB.me();
        expect(user?.availability).toHaveLength(1);
        expect(user?.availability).not.toContainEqual(time1);
        expect(user?.availability).toContainEqual(time2);
    });

    it('should do nothing when trying to remove a non-existent time slot', () => {
        const time = { day: "Thursday", startTime: "15:00", endTime: "16:00" };
        DB.addMeetingTime(time.day, time.startTime, time.endTime);
        DB.removeMeetingTime({ day: "non", startTime: "existent", endTime: "time" });
        const user = DB.me();
        expect(user?.availability).toHaveLength(1);
    });
  });

  // --- Study Session Management ---
  describe('Study Sessions', () => {
    let requester: Student, requestee: Student, course: Course;
    let mutualCourse: Course, requesterOnlyCourse: Course;
    
    beforeEach(() => {
        requester = DB.createUser('Requester', 'requester');
        requestee = DB.createUser('Requestee', 'requestee');
        
        // Login as requester to add courses
        DB.login('requester');
        mutualCourse = DB.getOrCreateCourse('MATH-101');
        requesterOnlyCourse = DB.getOrCreateCourse('HIST-202');
        DB.addEnrollment(mutualCourse.code);
        DB.addEnrollment(requesterOnlyCourse.code);
        DB.logout();
        
        // Login as requestee to add courses
        DB.login('requestee');
        DB.addEnrollment(mutualCourse.code);
        DB.logout();
        
        // Login back as requester for tests
        DB.login('requester');
        course = mutualCourse; // for existing tests
    });

    it('should list mutual courses between two students', () => {
        const mutual = DB.listMutualCourses(requestee.id);
        expect(mutual).toHaveLength(1);
        expect(mutual[0].code).toBe(mutualCourse.code);
    });

    it('should create a study session request', () => {
      const proposedTime = Date.now();
      const session = DB.createStudySessionRequest(requestee.id, course.id, proposedTime);
      expect(session.status).toBe('pending');
      const dbState = DB.dump();
      expect(dbState.studySessions).toHaveLength(1);
    });
    
    it('should list pending requests for the current user', () => {
      DB.createStudySessionRequest(requestee.id, course.id, Date.now());
      DB.logout();
      DB.login('requestee');

      const pendingRequests = DB.listPendingRequestsForMe();
      expect(pendingRequests).toHaveLength(1);
      const requesterInParticipants = pendingRequests[0].participants.find(p => p.id === requester.id);
      expect(requesterInParticipants?.name).toBe('Requester');
    });

    it('should update the status of a study session', () => {
      const session = DB.createStudySessionRequest(requestee.id, course.id, Date.now());
      DB.logout();
      DB.login('requestee');

      DB.updateStudySessionStatus(session.id, 'confirmed');
      const dbState = DB.dump();
      expect(dbState.studySessions[0].status).toBe('confirmed');
    });

    it('should throw an error if a user tries to update a session not sent to them', () => {
      const session = DB.createStudySessionRequest(requestee.id, course.id, Date.now());
      // Logged in as requester
      expect(() => DB.updateStudySessionStatus(session.id, 'confirmed'))
        .toThrow('You are not authorized to update this session.');
    });
  });
});
