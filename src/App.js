import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import {
  Container, Box, TextField, Button, Typography, Alert, Paper, Switch,
  AppBar, Toolbar, IconButton, LinearProgress, Chip, Stack, Drawer, Snackbar
} from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import MenuIcon from '@mui/icons-material/Menu';
import jsPDF from 'jspdf';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Document, Page, pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const API = process.env.REACT_APP_API_URL || "https://resume-matcher-backend-6-e3q6.onrender.com";


function SkillTags({ skills, color }) {
  if (!skills || skills.length === 0)
    return <span style={{ color: "#aaa" }}>None</span>;
  return skills.map(skill =>
    <span key={skill} style={{
      color: "#fff", background: color, borderRadius: 12,
      padding: "2px 12px", margin: "2px 6px 2px 0",
      display: "inline-block", fontSize: "0.95em", fontWeight: 500
    }}>{skill}</span>
  );
}

function Profile({ token }) {
  const [profile, setProfile] = useState({ username: '', name: "", bio: "", skills: [] });
  const [editMode, setEditMode] = useState(false);
  const [message, setMessage] = useState("");
  const [skillsInput, setSkillsInput] = useState("");

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(API + "/profile", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setProfile(data);
        setSkillsInput(data.skills ? data.skills.join(", ") : "");
      } catch {}
    }
    fetchProfile();
  }, [token, editMode]);

  function handleChange(e) { setProfile({ ...profile, [e.target.name]: e.target.value }); }
  function handleSkillsChange(e) { setSkillsInput(e.target.value); }
  async function handleSave() {
    const update = { ...profile, skills: skillsInput.split(",").map(s => s.trim()).filter(s => s) };
    const res = await fetch(API + "/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(update)
    });
    if (res.ok) {
      setMessage("Profile updated!");
      setEditMode(false);
      setProfile(update);
    } else {
      setMessage("Error updating profile");
    }
  }

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 5, borderRadius: 3 }}>
        <Typography variant="h4" sx={{ mb: 3, color: "#223a65" }}>Profile</Typography>
        <Box sx={{ mb: 2 }}>
          <Typography><b>Username:</b> {profile.username}</Typography>
        </Box>
        <Box sx={{ mb: 2 }}>
          <Typography><b>Name:</b></Typography>
          {editMode ? (
            <TextField fullWidth size="small" name="name" value={profile.name || ""} onChange={handleChange} />
          ) : (
            <Typography>{profile.name || <span style={{ color: "#999" }}>No name set</span>}</Typography>
          )}
        </Box>
        <Box sx={{ mb: 2 }}>
          <Typography><b>Bio:</b></Typography>
          {editMode ? (
            <TextField fullWidth size="small" name="bio" value={profile.bio || ""} onChange={handleChange} />
          ) : (
            <Typography>{profile.bio || <span style={{ color: "#999" }}>No bio set</span>}</Typography>
          )}
        </Box>
        <Box sx={{ mb: 2 }}>
          <Typography><b>Skills:</b></Typography>
          {editMode ? (
            <TextField fullWidth size="small" value={skillsInput} onChange={handleSkillsChange} helperText="Comma separated: e.g. Python, React, SQL" />
          ) : (
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", mt: 1 }}>
              {profile.skills && profile.skills.length > 0 ? (
                profile.skills.map((skill,idx) => <Chip key={skill+"-"+idx} label={skill} color="primary" />)
              ) : (
                <Typography color="text.secondary">No skills listed</Typography>
              )}
            </Stack>
          )}
        </Box>
        <Box sx={{ mt: 2 }}>
          {!editMode ?
            <Button variant="contained" color="info" onClick={() => setEditMode(true)}>Edit Profile</Button>
            :
            <>
              <Button variant="contained" color="success" onClick={handleSave}>Save</Button>{' '}
              <Button variant="outlined" color="secondary" onClick={() => setEditMode(false)}>Cancel</Button>
            </>
          }
        </Box>
        {message && <Alert severity="success" sx={{ mt: 2 }}>{message}</Alert>}
      </Paper>
    </Container>
  );
}

function App() {
  // States
  const [darkMode, setDarkMode] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [page, setPage] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [resume, setResume] = useState('');
  const [job, setJob] = useState('');
  const [match, setMatch] = useState(null);
  const [aiTips, setAiTips] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [adminData, setAdminData] = useState({});
  const fileInput = useRef();
  const [uploadMsg, setUploadMsg] = useState('');
  const [filePreview, setFilePreview] = useState(null);
  const [resetEmail, setResetEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPass, setNewPass] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [jobs, setJobs] = useState([]);
  const [addJob, setAddJob] = useState({ title: '', description: '', skills: '' });
  const [applyJobId, setApplyJobId] = useState('');
  const [applyResume, setApplyResume] = useState('');
  const [applyMsg, setApplyMsg] = useState('');
  const [viewApplications, setViewApplications] = useState({ show: false, jobId: "", apps: [] });
  // Notifications & Snackbar
  const [notifications, setNotifications] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  // Apply Dialog state
  const [applyOpen, setApplyOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  // Snackbar notification system
  function handleCloseSnackbar() { setSnackbarOpen(false); }
  function notify(message, severity = "info") {
    setSnackbarMsg(message);
    setSnackbarOpen(true);
    setNotifications(prev => [...prev, { message, severity, id: Date.now() }]);
  }

  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        setNotifications(n => n.slice(1));
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [notifications]);

  const theme = createTheme({ palette: { mode: darkMode ? 'dark' : 'light' } });
  const pageStyle = { background: darkMode ? "#181924" : "#f6f8fb", minHeight: "100vh", paddingBottom: 50 };
  const paperStyle = {
    maxWidth: 680, margin: "40px auto", borderRadius: 20,
    padding: 40, background: darkMode ? "#fcfbf8" : "#fff",
    color: darkMode ? "#223a65" : "#111"
  };

  // Auth
const handleAuth = async (type) => {
  setError('');
  try {
    const url =
      type === 'login'
        ? 'https://resume-matcher-backend-6-e3q6.onrender.com/api/login'
        : 'https://resume-matcher-backend-6-e3q6.onrender.com/api/register';

    const res = await axios.post(url, { username, password });

    setToken(res.data.token);
    setPage('matcher');
    notify(type === 'login' ? "Login successful!" : "Registered & logged in!", "success");
  } catch (e) {
    setError(e.response?.data?.error || 'Auth error');
    notify("Authentication failed!", "error");
  }
};


  // Resume upload with preview
  const handleUpload = async () => {
    if (!fileInput.current.files[0]) {
      setUploadMsg('Select a file!');
      notify("Please select a resume file.", "warning");
      return;
    }
     const form = new FormData();
  form.append('resume', fileInput.current.files[0]);
  try {
    const res = await axios.post(
      'https://resume-matcher-backend-6-e3q6.onrender.com/api/upload',
      form,
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
    );
    setUploadMsg('Uploaded! File URL: ' + res.data.url);
    setFilePreview(res.data.url);
    if (res.data.resumeText) setResume(res.data.resumeText);
    notify("Resume uploaded successfully!", "success");
  } catch (e) {
    setUploadMsg('Upload error.');
    notify("Upload error!", "error");
  }
};
  // Resume matcher
  const matchResume = async (e) => {
    e.preventDefault();
    setError('');
    setMatch(null); setAiTips('');
     try {
    const res = await axios.post(
      'https://resume-matcher-backend-6-e3q6.onrender.com/api/match',
      { resume, job },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setMatch(res.data);
    notify(`Your resume matched ${res.data.score}% for this job!`, res.data.score > 50 ? "success" : "info");
  } catch (e) {
    setError(e.response?.data?.error || 'Match error');
    notify("Matching error!", "error");
  }
};


  // Dashboard/history
  const fetchDashboard = async () => {
  try {
    const res = await axios.get(
      'https://resume-matcher-backend-6-e3q6.onrender.com/api/my-matches',
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setHistory(res.data.matches);
    notify("Fetched match history.", "info");
  } catch (e) {
    notify("Could not fetch history.", "error");
  }
};

  // Admin analytics
  const fetchAdminAnalytics = async () => {
  try {
    const res = await axios.get(
      'https://resume-matcher-backend-6-e3q6.onrender.com/api/admin',
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setAdminData(res.data);
    notify("Loaded admin analytics.", "info");
  } catch (e) {
    notify("Failed to load analytics.", "error");
  }
};
  // AI Resume Tips
const getAiTips = async () => {
  if (!match) return;
  setAiLoading(true);
  setAiTips("");
  try {
    const res = await axios.post(
      'https://resume-matcher-backend-6-e3q6.onrender.com/api/ai-tips',
      {
        resume: match.resumeSkills.join(", "),
        job: match.jobSkills.join(", "),
        missingSkills: match.missingSkills
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setAiTips(res.data.tips);
    notify("AI resume tips loaded.", "info");
  } catch {
    setAiTips("Could not fetch AI suggestions.");
    notify("Failed to load AI resume tips.", "error");
  }
  setAiLoading(false);
};
// Job Board
const loadJobs = async () => {
  try {
    const res = await axios.get(
      'https://resume-matcher-backend-6-e3q6.onrender.com/api/jobs'
    );
    setJobs(res.data.jobs);
    notify("Loaded job listings.", "info");
  } catch (error) {
    notify("Failed to load jobs.", "error");
  }
};

 // Post a job (Admin)
const postJob = async () => {
  if (!addJob.title || !addJob.description || !addJob.skills) {
    notify("Fill all fields to post a job.", "warning");
    return;
  }
  try {
    await axios.post(
      'https://resume-matcher-backend-6-e3q6.onrender.com/api/jobs',
      {
        title: addJob.title,
        description: addJob.description,
        skills: addJob.skills.split(',').map(s => s.trim())
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setAddJob({ title: '', description: '', skills: '' });
    loadJobs();
    notify("Job posted successfully!", "success");
  } catch (error) {
    console.error("Error posting job:", error);
    notify("Failed to post job.", "error");
  }
};



  // Apply for a job
const handleApply = async () => {
  if (!applyJobId || !applyResume) {
    notify("Fill all fields to apply.", "warning");
    return;
  }

  try {
    await axios.post(
      'https://resume-matcher-backend-6-e3q6.onrender.com/api/apply',
      { jobId: applyJobId, resumeText: applyResume },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Clear input fields and show success
    setApplyMsg("Application sent!");
    setApplyJobId('');
    setApplyResume('');
    notify("Your application was submitted!", "success");

  } catch (error) {
    console.error("Failed to apply:", error);
    notify("Failed to submit application.", "error");
  }
};

// Admin: view applications
const fetchApplications = async (jobId) => {
  try {
    const res = await axios.get(
      `https://resume-matcher-backend-6-e3q6.onrender.com/api/applications/${jobId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setViewApplications({ show: true, jobId, apps: res.data.applications });
    notify("Loaded applications for job.", "info");
  } catch (error) {
    console.error(error.response?.data || error.message);
    notify("Failed to load applications.", "error");
  }
};

  // PDF download
  const downloadPDF = () => {
    if (!match) return;
    const doc = new jsPDF();
    doc.text("Resume Match Report",10,10);
    doc.text("User: "+match.user,10,20);
    doc.text("Score: "+match.score+"%",10,30);
    doc.text("Resume Skills: "+match.resumeSkills.join(", "),10,40);
    doc.text("Job Skills: "+match.jobSkills.join(", "),10,50);
    doc.text("Matched: "+match.matchedSkills.join(", "),10,60);
    doc.text("Missing: "+match.missingSkills.join(", "),10,70);
    doc.save("MatchReport.pdf");
    notify("Match report downloaded.", "info");
  };

  // Navbar with mobile-friendly Drawer
  const pages = [
    { label: "Jobs", page: "jobs" },
    { label: "Profile", page: "profile" },
    { label: "Matcher", page: "matcher" },
    { label: "Dashboard", page: "dashboard" },
    { label: "Admin", page: "admin" }
  ];

  const navbar = (
    <>
      <AppBar position="static" sx={{ background: "#223a65" }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }}
            onClick={() => setDrawerOpen(true)}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Resume Matcher
          </Typography>
          <Switch checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
          <span style={{ marginLeft: 7, fontSize: "1em", color:"#FFD600" }}>{darkMode ? "Dark" : "Light"}</span>
        </Toolbar>
      </AppBar>
      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 210, pt: 3, pl:2 }}>
          {pages.map(opt => (
            <Button key={opt.page} fullWidth variant="text"
              color={page === opt.page ? "secondary" : "primary"} 
              sx={{mb:1, justifyContent:'flex-start'}}
              onClick={() => { setPage(opt.page); setDrawerOpen(false); }}>
              {opt.label}
            </Button>
          ))}
        </Box>
      </Drawer>
    </>
  );

  return (
    <ThemeProvider theme={theme}>
      <div style={pageStyle}>
        {navbar}
        {page === 'login' && (
          <Paper elevation={4} style={paperStyle}>
            <Box sx={{ "& > *": { m: 1 }, mb: 2 }} >
              <Typography align="center" variant="h5" sx={{ mb: 2, color: "#223a65" }}>
                Login or Register
              </Typography>
              <TextField label="Username or Email" value={username} onChange={e=>setUsername(e.target.value)} fullWidth />
              <TextField label="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} fullWidth />
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button variant="contained" color="primary" onClick={() => handleAuth('login')} fullWidth>Login</Button>
                <Button variant="outlined" color="secondary" onClick={() => handleAuth('register')} fullWidth>Register</Button>
                <Button color="info" onClick={() => setPage('reset')}>Forgot password?</Button>
              </Box>
              {error && <Alert severity="error">{error}</Alert>}
            </Box>
          </Paper>
        )}
        {page === 'reset' &&
          <Paper elevation={4} style={paperStyle}>
            <Typography variant="h5" sx={{ color: "#223a65" }}>Password Reset</Typography>
            <TextField label="Your email" fullWidth value={resetEmail} onChange={e => setResetEmail(e.target.value)} />
            <Button variant="contained" color="primary" onClick={async ()=>{
              await axios.post(API+"/request-reset",{username:resetEmail});
              setResetMsg("If the email exists, a reset link was sent.");
              notify("If the email exists, reset link sent.", "info");
            }}>Request Reset Link</Button>
            {resetMsg && <Alert severity="info">{resetMsg}</Alert>}
            <Typography sx={{mt:2}}>If you have a reset link:</Typography>
            <TextField label="Reset Token" fullWidth value={resetToken} onChange={e => setResetToken(e.target.value)} />
            <TextField label="New Password" fullWidth type="password" value={newPass} onChange={e => setNewPass(e.target.value)} />
            <Button variant="contained" color="success" onClick={async ()=>{
              try {
                await axios.post(API+"/reset-password",{token:resetToken, newPassword:newPass});
                setResetMsg("Password updated! Now you can log in.");
                notify("Password updated! Log in now.", "success");
              } catch {
                setResetMsg("Invalid or expired token.");
                notify("Password reset failed.", "error");
              }
            }}>Reset Password</Button>
          </Paper>
        }
        {page === 'profile' && <Profile token={token} />}
        {page === 'matcher' && (
          <Paper elevation={4} style={paperStyle}>
            <Box component="form" onSubmit={matchResume} sx={{ "& > *": { m: 1 } }}>
              <Typography align="center" variant="h5" sx={{ mb: 2, color: "#223a65" }}>
                Resume Matcher
              </Typography>
              <input type="file" ref={fileInput} style={{marginBottom:8}} accept=".pdf,.txt,.docx" />
              <Button variant="outlined" color="info" onClick={handleUpload}>Upload Resume (.pdf, .txt, .docx)</Button>
              {uploadMsg && <Alert sx={{ mt: 1 }}>{uploadMsg}</Alert>}
              {filePreview &&
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">Resume Preview:</Typography>
                  {filePreview.endsWith('.pdf') ? (
                    <Document file={API.replace('/api','') + filePreview} onLoadError={console.error}>
                      <Page pageNumber={1} width={400} />
                    </Document>
                  ) : (
                    <a href={API.replace('/api','') + filePreview} target="_blank" rel="noopener noreferrer">
                      Open Resume File
                    </a>
                  )}
                </Box>
              }
              <TextField
                label="Your Resume (Text)"
                multiline rows={6}
                value={resume}
                onChange={e => setResume(e.target.value)}
                fullWidth
              />
              <TextField
                label="Job Description"
                multiline rows={6}
                value={job}
                onChange={e => setJob(e.target.value)}
                fullWidth
              />
              <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                <Button type="submit" variant="contained" color="primary" fullWidth>Match</Button>
                <Button type="button" variant="outlined" fullWidth onClick={() => { setPage('login'); setToken(''); }}>Logout</Button>
              </Box>
              {error && <Alert severity="error">{error}</Alert>}
              {match && <Box sx={{ mt: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={match.score}
                  sx={{ height: 16, borderRadius: 12, mb: 2 }}
                  color={match.score > 50 ? "success" : "warning"}
                />
                <Alert severity={match.score > 50 ? "success" : "info"} sx={{ mt: 1 }}>
                  <Typography variant="h6">{match.score}% skill match!</Typography>
                  <div><b>User:</b> {match.user}</div>
                  <div><b>Resume Skills:</b> <SkillTags skills={match.resumeSkills} color="#1976d2" /></div>
                  <div><b>Job Skills:</b> <SkillTags skills={match.jobSkills} color="#d32f2f" /></div>
                  <div><b>Matched:</b> <SkillTags skills={match.matchedSkills} color="#388e3c" /></div>
                  <div><b>Missing:</b> <SkillTags skills={match.missingSkills} color="#FFD600" /></div>
                  <Button variant="outlined" color="secondary" sx={{mt:2}} onClick={downloadPDF}>Download Match Report (PDF)</Button>
                  <Button variant="contained" color="info" sx={{mt:2}} onClick={getAiTips} disabled={aiLoading}>
                    {aiLoading ? "Thinking…" : "Show AI Resume Tips"}
                  </Button>
                  {aiTips &&
                    <Alert severity="info" sx={{mt:2}}>
                      <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: "#1976d2" }}>AI Resume Tips:</Typography>
                      <div>{aiTips.split('\n').map((tip, idx) => <div key={idx}>{tip}</div>)}</div>
                    </Alert>
                  }
                </Alert>
              </Box>}
            </Box>
          </Paper>
        )}
        {page === 'jobs' &&
          <Container maxWidth="md">
            <Typography variant="h4" sx={{mt:4, mb:2, color:"#223a65"}}>Job Board</Typography>
            <Button variant="contained" color="primary" sx={{mb:2}} onClick={loadJobs}>Load Jobs</Button>
            {jobs.length === 0 && (
              <Box sx={{ textAlign: "center", my: 8 }}>
                <Typography variant="h6">🚀 No job listings yet—check back soon!</Typography>
              </Box>
            )}
            {token && username === 'admin' &&
              <Paper sx={{p:3, mb:3}}>
                <Typography variant="h6">Post a Job (Admin)</Typography>
                <TextField label="Title" value={addJob.title} onChange={e=>setAddJob({...addJob, title:e.target.value})} fullWidth sx={{mb:1}} />
                <TextField label="Description" value={addJob.description} onChange={e=>setAddJob({...addJob, description:e.target.value})} fullWidth multiline rows={3} sx={{mb:1}} />
                <TextField label="Skills (comma separated)" value={addJob.skills} onChange={e=>setAddJob({...addJob, skills:e.target.value})} fullWidth sx={{mb:1}} />
                <Button variant="contained" color="success" onClick={postJob}>Post Job</Button>
              </Paper>
            }
            {jobs.map(job =>
              <Paper elevation={3} sx={{
                p: 3, mb: 2, borderRadius: 3,
                transition: "box-shadow 0.2s",
                ':hover': { boxShadow: 6 }
              }} key={job._id}>
                <Typography variant="h6" sx={{ mb: 1 }}>{job.title}</Typography>
                <Typography sx={{whiteSpace:"pre-line", mb:1}} color="text.secondary">{job.description}</Typography>
                <Stack direction="row" spacing={1}>
                  {job.skills.map(skill => <Chip key={skill} label={skill} color="primary" />)}
                </Stack>
                <Typography sx={{ mt: 1, fontSize: 13, color: "#888" }}>
                  Location: <b>{job.location || "Not set"}</b>
                </Typography>
                {token && username !== 'admin' &&
                  <Box sx={{mt:2, mb:1, p:1, border:"1px solid #eee", borderRadius:2}}>
                    <Button variant="contained" color="success" size="small"
                      onClick={()=>{
                        setSelectedJob(job); setApplyOpen(true); setApplyJobId(job._id);
                      }}>
                      Apply Now
                    </Button>
                  </Box>
                }
                {token && username === 'admin' &&
                  <Box sx={{mt:2}}>
                    <Button variant="outlined" color="secondary" size="small"
                      onClick={() => fetchApplications(job._id)}>
                      View Applications
                    </Button>
                  </Box>
                }
              </Paper>
            )}
          </Container>
        }
        {/* Animated Application Apply Dialog */}
        <Dialog open={applyOpen} onClose={() => setApplyOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Apply for {selectedJob ? selectedJob.title : ""}</DialogTitle>
          <DialogContent>
            <TextField
              label="Paste or Write Your Resume"
              multiline
              rows={3}
              value={applyResume}
              onChange={e => setApplyResume(e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
            />
            {applyMsg && <Alert sx={{ mb: 2 }}>{applyMsg}</Alert>}
          </DialogContent>
          <DialogActions>
            <Button color="secondary" onClick={() => setApplyOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                handleApply();
                setApplyOpen(false);
              }}
            >
              Send Application
            </Button>
          </DialogActions>
        </Dialog>
        {viewApplications.show &&
          <Paper sx={{p:3, mt:2}}>
            <Typography variant="h6">Applications for Job</Typography>
            <Button variant="outlined" color="secondary" sx={{mb:2}}
              onClick={() => setViewApplications({ show: false, jobId: "", apps: [] })}>
              Close
            </Button>
            {viewApplications.apps.length === 0 && <Typography>No applications yet.</Typography>}
            {viewApplications.apps.map(app =>
              <Paper elevation={1} sx={{p:2, mb:2}} key={app._id}>
                <b>Applicant:</b> {app.applicant}<br/>
                <b>Applied At:</b> {new Date(app.appliedAt).toLocaleString()}<br/>
                <b>Resume:</b> <div style={{whiteSpace:'pre-line'}}>{app.resumeText}</div>
              </Paper>
            )}
          </Paper>
        }
        {page === 'dashboard' && (
          <Paper elevation={4} style={paperStyle}>
            <Box sx={{ "& > *": { m: 1 }, mb: 2 }}>
              <Typography align="center" variant="h5" sx={{ mb: 2, color: "#223a65" }}>
                Dashboard (Match History)
              </Typography>
              <Button type="button" variant="contained" color="success" onClick={fetchDashboard}>Load My History</Button>
              {history.length > 0 && (
                <Box sx={{ mt:2 }}>
                  <Typography variant="h6" sx={{ color: "#1abc9c" }}>Recent Matches</Typography>
                  {history.map(match =>
                    <div key={match._id} style={{ fontSize: "0.98em", marginBottom:4 }}>
                      [{new Date(match.time).toLocaleString()}]
                      <b> Score:</b> {match.score}% | <b>Skills:</b> {match.matchedSkills.join(', ')}
                    </div>
                  )}
                </Box>
              )}
            </Box>
          </Paper>
        )}
        {page === 'admin' && (
          <Paper elevation={4} style={paperStyle}>
            <Box sx={{ "& > *": { m: 1 }, mb: 2 }}>
              <Typography align="center" variant="h5" sx={{ mb: 2, color: "#FFD600" }}>
                Admin Analytics Panel
              </Typography>
              <Button type="button" variant="contained" color="secondary" onClick={fetchAdminAnalytics}>Load Analytics</Button>
              {adminData.users && (
                <Box sx={{ mt:2 }}>
                  <Typography variant="h6" sx={{ color: "#FFD600" }}>All Users ({adminData.users.length})</Typography>
                  {adminData.users.map(u => <div key={u._id}>{u.username}</div>)}
                  <Typography variant="h6" sx={{ mt:2, color:"#223a65" }}>Top Skills</Typography>
                  {adminData.topSkills && adminData.topSkills.map((s,i) =>
                    <div key={s.skill}>{i+1}. {s.skill} ({s.freq})</div>
                  )}
                  <div>Total Matches: {adminData.matchCount}</div>
                </Box>
              )}
            </Box>
          </Paper>
        )}
        {/* In-app Notifications: always at top-right */}
        <Box sx={{position:'fixed', top:80, right:24, zIndex:9999}}>
          {notifications.map(n =>
            <Alert
              key={n.id}
              severity={n.severity}
              sx={{ mb: 2, minWidth: 260, boxShadow: 2, fontWeight: 500 }}
              onClose={() => setNotifications(notifications.filter(notif => notif.id !== n.id))}
            >
              {n.message}
            </Alert>
          )}
        </Box>
        {/* Snackbar Notifications */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3500}
          onClose={handleCloseSnackbar}
          message={snackbarMsg}
        />
      </div>
    </ThemeProvider>
  );
}

export default App;