const loader = document.querySelector('.loader');
const revealItems = document.querySelectorAll('.reveal');
const scrollTopBtn = document.querySelector('.scroll-top');

const STUDENT_STORAGE_KEY = 'aarambh-students';
const SESSION_STORAGE_KEY = 'aarambh-session';
const ISSUES_STORAGE_KEY = 'aarambh-issues';
const ADMIN_AUTH_STORAGE_KEY = 'aarambh-admin-auth';
const MONTHLY_FEE = 700;
const ADMIN_PASSWORD = 'uniqueadmin';

function getStudents() {
  const stored = localStorage.getItem(STUDENT_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveStudents(students) {
  localStorage.setItem(STUDENT_STORAGE_KEY, JSON.stringify(students));
}

function getSession() {
  const stored = localStorage.getItem(SESSION_STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
}

function saveSession(session) {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

function isAdminAuthorized() {
  return localStorage.getItem(ADMIN_AUTH_STORAGE_KEY) === 'true';
}

function authorizeAdmin() {
  const enteredPassword = window.prompt('Enter admin password');
  if (enteredPassword === ADMIN_PASSWORD) {
    localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, 'true');
    return true;
  }
  return false;
}

function getIssues() {
  const stored = localStorage.getItem(ISSUES_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveIssues(issues) {
  localStorage.setItem(ISSUES_STORAGE_KEY, JSON.stringify(issues));
}

function createOrUpdateStudent({ name, address, mobile }) {
  const students = getStudents();
  const existingStudent = students.find((student) => student.mobile === mobile);

  if (existingStudent) {
    existingStudent.name = name || existingStudent.name;
    existingStudent.address = address || existingStudent.address || 'Not provided';
    existingStudent.mobile = mobile;
  } else {
    students.push({
      name: name || 'Guest',
      address: address || 'Not provided',
      mobile,
      paid: false,
      startingMonth: 'August'
    });
  }

  saveStudents(students);
  return students;
}

function updateStats() {
  const students = getStudents();
  const totalStudents = document.getElementById('totalStudents');
  const paidStudents = document.getElementById('paidStudents');
  const unpaidStudents = document.getElementById('unpaidStudents');

  if (totalStudents) totalStudents.textContent = students.length;
  if (paidStudents) paidStudents.textContent = students.filter((student) => student.paid).length;
  if (unpaidStudents) unpaidStudents.textContent = students.filter((student) => !student.paid).length;
}

function renderAdminTable(filter = '') {
  const studentTableBody = document.getElementById('studentTableBody');
  if (!studentTableBody) return;

  const students = getStudents().filter((student) => {
    const query = filter.toLowerCase();
    return (
      student.name.toLowerCase().includes(query) ||
      student.address.toLowerCase().includes(query) ||
      student.mobile.includes(query)
    );
  });

  studentTableBody.innerHTML = '';

  if (!students.length) {
    studentTableBody.innerHTML = '<tr><td colspan="5">No students registered yet.</td></tr>';
    updateStats();
    return;
  }

  students.forEach((student, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${student.name}</td>
      <td>${student.address}</td>
      <td>${student.mobile}</td>
      <td><button class="status-btn ${student.paid ? 'paid' : ''}" data-index="${index}">${student.paid ? 'Paid' : 'Unpaid'}</button></td>
      <td><select class="month-select" data-index="${index}">
        ${['January','February','March','April','May','June','July','August','September','October','November','December']
          .map((month) => `<option value="${month}" ${month === student.startingMonth ? 'selected' : ''}>${month}</option>`)
          .join('')}</select></td>
    `;
    studentTableBody.appendChild(row);
  });

  updateStats();
}

if (loader) {
  window.addEventListener('load', () => {
    setTimeout(() => loader.classList.add('is-hidden'), 500);
  });
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('show');
      }
    });
  },
  { threshold: 0.15 }
);

revealItems.forEach((item) => observer.observe(item));

window.addEventListener('scroll', () => {
  if (window.scrollY > 600) {
    scrollTopBtn?.classList.add('show');
  } else {
    scrollTopBtn?.classList.remove('show');
  }
});

scrollTopBtn?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

const loginForm = document.getElementById('loginForm');
const errorMessage = document.getElementById('errorMessage');

loginForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  const name = formData.get('name').toString().trim();
  const mobile = formData.get('mobile').toString().trim();
  const address = formData.get('address').toString().trim();

  if (!mobile) {
    errorMessage.textContent = 'Please enter your mobile number.';
    errorMessage.classList.add('show');
    return;
  }

  createOrUpdateStudent({ name, address, mobile });
  saveSession({ role: 'user', name: name || 'Guest', mobile, address });
  window.location.href = 'dashboard.html';
});

const logoutButton = document.getElementById('logoutButton');
logoutButton?.addEventListener('click', () => {
  clearSession();
  localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
  window.location.href = 'login.html';
});

const issueForm = document.getElementById('issueForm');
issueForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(issueForm);
  const issue = formData.get('issue').toString().trim();
  if (!issue) return;

  const issues = getIssues();
  issues.push({
    message: issue,
    submittedAt: new Date().toLocaleString(),
    user: getSession()?.name || 'Guest'
  });
  saveIssues(issues);
  issueForm.reset();
  alert('Issue reported successfully.');
});

const searchInput = document.getElementById('searchInput');
searchInput?.addEventListener('input', (event) => {
  renderAdminTable(event.target.value);
});

const studentTableBody = document.getElementById('studentTableBody');
studentTableBody?.addEventListener('click', (event) => {
  const button = event.target.closest('.status-btn');
  if (!button) return;
  const index = Number(button.dataset.index);
  const students = getStudents();
  students[index].paid = !students[index].paid;
  saveStudents(students);
  renderAdminTable(searchInput?.value || '');
});

studentTableBody?.addEventListener('change', (event) => {
  const select = event.target.closest('.month-select');
  if (!select) return;
  const index = Number(select.dataset.index);
  const students = getStudents();
  students[index].startingMonth = select.value;
  saveStudents(students);
  renderAdminTable(searchInput?.value || '');
});

const session = getSession();
if (window.location.pathname.includes('dashboard.html')) {
  if (!session || session.role !== 'user') {
    window.location.href = 'login.html';
  } else {
    const userName = document.getElementById('userName');
    const profileName = document.getElementById('profileName');
    const profileMobile = document.getElementById('profileMobile');
    const profileAddress = document.getElementById('profileAddress');
    const profileFee = document.getElementById('profileFee');

    if (userName) userName.textContent = session.name || 'Student';
    if (profileName) profileName.textContent = session.name || 'Not provided';
    if (profileMobile) profileMobile.textContent = session.mobile || 'Not provided';
    if (profileAddress) profileAddress.textContent = session.address || 'Not provided';

    const student = getStudents().find((item) => item.mobile === session.mobile);
    if (profileFee) {
      profileFee.textContent = student?.paid ? 'Paid' : 'Pending';
    }
  }
}

if (window.location.pathname.includes('admin.html')) {
  if (!isAdminAuthorized()) {
    if (!authorizeAdmin()) {
      window.location.href = 'login.html';
    }
  }

  renderAdminTable();
  updateStats();
  const feeValue = document.getElementById('feeValue');
  if (feeValue) feeValue.textContent = `₹${MONTHLY_FEE}`;
}

renderAdminTable();
updateStats();
