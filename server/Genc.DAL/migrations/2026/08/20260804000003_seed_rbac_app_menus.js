const mongoose = require('mongoose');
const logger = require('../../../utils/logger');

/**
 * Umzug Migration: 20260804000003_seed_rbac_app_menus.js
 * Seeds default AppDefinitions, AppMenus, and RolePermissions into database collections.
 */
module.exports = {
  up: async () => {
    const db = mongoose.connection.db;

    // 1. Seed App Definitions
    const appsCol = db.collection('appdefinitions');
    const apps = [
      { app_code: 'STUDENT_PORTAL', app_name: 'Student Portal', route_path: '/student', icon: 'school', is_active: true, created_at: new Date() },
      { app_code: 'FACULTY_PORTAL', app_name: 'Faculty Portal', route_path: '/faculty', icon: 'dashboard', is_active: true, created_at: new Date() },
      { app_code: 'HOD_PORTAL', app_name: 'HOD Department Portal', route_path: '/faculty', icon: 'domain', is_active: true, created_at: new Date() },
      { app_code: 'LIBRARIAN_PORTAL', app_name: 'Library Management', route_path: '/librarian', icon: 'book', is_active: true, created_at: new Date() },
      { app_code: 'SECURITY_PORTAL', app_name: 'Security Gate', route_path: '/security', icon: 'security', is_active: true, created_at: new Date() },
    ];
    for (const app of apps) {
      await appsCol.updateOne({ app_code: app.app_code }, { $set: app }, { upsert: true });
    }

    // 2. Seed App Menus
    const menusCol = db.collection('appmenus');
    const menus = [
      { menu_code: 'STUDENT_PROFILE', app_code: 'STUDENT_PORTAL', title: 'Profile', path: '/student/profile', icon: 'person', order_index: 1, created_at: new Date() },
      { menu_code: 'STUDENT_SPECIAL_PASS', app_code: 'STUDENT_PORTAL', title: 'Special Pass', path: '/student/special-pass', icon: 'assignment', order_index: 2, created_at: new Date() },
      { menu_code: 'STUDENT_GATE_PASS', app_code: 'STUDENT_PORTAL', title: 'Gate Pass', path: '/student/active-gate-pass', icon: 'badge', order_index: 3, created_at: new Date() },
      
      { menu_code: 'FACULTY_SPECIAL_PASSES', app_code: 'FACULTY_PORTAL', title: 'Special Passes', path: '/faculty/special-passes', icon: 'assignment_turned_in', order_index: 1, created_at: new Date() },
      { menu_code: 'FACULTY_GATE_PASSES', app_code: 'FACULTY_PORTAL', title: 'Gate Passes', path: '/faculty/gate-pass', icon: 'verified_user', order_index: 2, created_at: new Date() },
      { menu_code: 'FACULTY_LATE_ENTRIES', app_code: 'FACULTY_PORTAL', title: 'Late Entries', path: '/faculty/late-entries', icon: 'timer', order_index: 3, created_at: new Date() },

      { menu_code: 'HOD_SPECIAL_PASSES', app_code: 'HOD_PORTAL', title: 'HOD Special Passes', path: '/faculty/special-passes', icon: 'assignment_turned_in', order_index: 1, created_at: new Date() },
      { menu_code: 'HOD_GATE_PASSES', app_code: 'HOD_PORTAL', title: 'HOD Gate Passes', path: '/faculty/gate-pass', icon: 'verified_user', order_index: 2, created_at: new Date() },
      { menu_code: 'HOD_AUDIT_LOGS', app_code: 'HOD_PORTAL', title: 'Audit Trail', path: '/faculty/audit', icon: 'analytics', order_index: 3, created_at: new Date() },

      { menu_code: 'SECURITY_DASHBOARD', app_code: 'SECURITY_PORTAL', title: 'Security Dashboard', path: '/security', icon: 'security', order_index: 1, created_at: new Date() },
      { menu_code: 'LIBRARIAN_DASHBOARD', app_code: 'LIBRARIAN_PORTAL', title: 'Library Dashboard', path: '/librarian', icon: 'book', order_index: 1, created_at: new Date() },
    ];

    for (const menu of menus) {
      await menusCol.updateOne({ menu_code: menu.menu_code }, { $set: menu }, { upsert: true });
    }

    // 3. Seed Role Permissions
    const rolePermCol = db.collection('rolepermissions');
    const rolePermissions = [
      {
        role: 'student',
        allowed_apps: ['STUDENT_PORTAL'],
        allowed_menus: ['STUDENT_PROFILE', 'STUDENT_SPECIAL_PASS', 'STUDENT_GATE_PASS'],
        permissions: ['READ_SELF_PROFILE', 'REQUEST_SPECIAL_PASS', 'REQUEST_GATE_PASS'],
        created_at: new Date(),
      },
      {
        role: 'faculty',
        allowed_apps: ['FACULTY_PORTAL'],
        allowed_menus: ['FACULTY_SPECIAL_PASSES', 'FACULTY_GATE_PASSES', 'FACULTY_LATE_ENTRIES'],
        permissions: ['READ_DEPT_STUDENTS', 'APPROVE_FACULTY_GATEPASS', 'RECORD_LATE_ENTRY'],
        created_at: new Date(),
      },
      {
        role: 'hod',
        allowed_apps: ['FACULTY_PORTAL', 'HOD_PORTAL'],
        allowed_menus: ['HOD_SPECIAL_PASSES', 'HOD_GATE_PASSES', 'HOD_AUDIT_LOGS'],
        permissions: ['READ_DEPT_STUDENTS', 'APPROVE_HOD_GATEPASS', 'APPROVE_SPECIAL_PASS', 'VIEW_AUDIT_LOGS'],
        created_at: new Date(),
      },
      {
        role: 'librarian',
        allowed_apps: ['LIBRARIAN_PORTAL'],
        allowed_menus: ['LIBRARIAN_DASHBOARD'],
        permissions: ['MANAGE_BOOKS', 'MANAGE_BORROWINGS'],
        created_at: new Date(),
      },
      {
        role: 'security',
        allowed_apps: ['SECURITY_PORTAL'],
        allowed_menus: ['SECURITY_DASHBOARD'],
        permissions: ['SCAN_QR_GATEPASS', 'VERIFY_ENTRY_EXIT'],
        created_at: new Date(),
      },
      {
        role: 'admin',
        allowed_apps: ['STUDENT_PORTAL', 'FACULTY_PORTAL', 'HOD_PORTAL', 'LIBRARIAN_PORTAL', 'SECURITY_PORTAL'],
        allowed_menus: ['STUDENT_PROFILE', 'FACULTY_SPECIAL_PASSES', 'HOD_AUDIT_LOGS', 'SECURITY_DASHBOARD', 'LIBRARIAN_DASHBOARD'],
        permissions: ['ADMIN_ALL'],
        created_at: new Date(),
      },
    ];

    for (const rp of rolePermissions) {
      await rolePermCol.updateOne({ role: rp.role }, { $set: rp }, { upsert: true });
    }

    logger.info('✅ Seeded AppDefinitions, AppMenus, and RolePermissions successfully.');
  },

  down: async () => {
    logger.info('Reverting 20260804000003_seed_rbac_app_menus migration...');
  },
};
