import React, { useState, useEffect, useRef } from 'react';
import { Check, Plus, Trash2, LogOut, Search, ArrowLeft, Send, MessageCircle, FileText, FileSpreadsheet, Menu, X, ListTodo, Ticket, Home, Clock, User, Play, Pause, BarChart3, Activity, Sparkles, TrendingUp, Target, Zap, Settings, Save, Eye, EyeOff } from 'lucide-react';
import { auth, todos as todosApi, comments as commentsApi, exportData, tickets as ticketsApi, ticketComments as ticketCommentsApi, timeTracking, activities as activitiesApi, analytics, ai, userProfile } from './api';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  // Auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  // Todos state
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [priority, setPriority] = useState('medium');
  const [category, setCategory] = useState('personal');
  const [selectedTodo, setSelectedTodo] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  // Tickets state
  const [ticketsList, setTicketsList] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketCommentsList, setTicketCommentsList] = useState([]);
  const [newTicketComment, setNewTicketComment] = useState('');
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [newTicket, setNewTicket] = useState({ ticket_id: '', client_name: '', subject: '', description: '', priority: 'medium' });
  const [ticketStatusFilter, setTicketStatusFilter] = useState('all');
  const [ticketClientFilter, setTicketClientFilter] = useState('all');
  const [ticketSearchQuery, setTicketSearchQuery] = useState('');
  const [clientsList, setClientsList] = useState([]);

  // Export state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState('todos'); // 'todos' or 'tickets'
  const [exportFormat, setExportFormat] = useState('pdf'); // 'pdf' or 'excel'
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');

  // Analytics & Performance state
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  // Time tracking state
  const [activeTimer, setActiveTimer] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  
  // AI state
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiContext, setAiContext] = useState('');
  
  // Advanced AI features
  const [showAIPlanner, setShowAIPlanner] = useState(false);
  const [showWorkflowOptimizer, setShowWorkflowOptimizer] = useState(false);
  const [showSmartSuggestions, setShowSmartSuggestions] = useState(false);
  const [aiPlan, setAiPlan] = useState(null);
  const [workflowOptimization, setWorkflowOptimization] = useState(null);
  const [smartSuggestions, setSmartSuggestions] = useState([]);
  const [currentContext, setCurrentContext] = useState('general');
  const [currentMood, setCurrentMood] = useState('neutral');
  const [availableTime, setAvailableTime] = useState(30);

  // Profile state
  const [showProfile, setShowProfile] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) setUser(JSON.parse(userData));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      fetchTodos();
      fetchTickets();
      fetchStats();
      fetchActivities();
    }
  }, [user]);

  // Timer effect
  useEffect(() => {
    let interval;
    if (activeTimer) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTimer]);

  // Close sidebar when clicking outside or changing page
  const closeSidebar = () => setSidebarOpen(false);
  const navigateTo = (page) => { setCurrentPage(page); closeSidebar(); };

  // Auth functions
  const handleAuth = async () => {
    if (!email || !password) return alert('Please enter email and password');
    if (isSignUp && !name) return alert('Please enter your name');
    
    try {
      const response = isSignUp ? 
        await auth.register(email, password, name, mobile) : 
        await auth.login(email, password);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setUser(response.data.user);
      setEmail(''); setPassword(''); setName(''); setMobile('');
    } catch (error) { alert(error.response?.data?.message || 'Authentication failed'); }
  };

  const handleLogout = () => {
    localStorage.removeItem('token'); localStorage.removeItem('user');
    setUser(null); setTodos([]); setTicketsList([]);
  };

  // Todo functions
  const fetchTodos = async () => {
    try { const res = await todosApi.getAll(); setTodos(res.data); } catch (e) { console.error(e); }
  };

  const addTodo = async () => {
    if (!newTodo.trim()) return;
    try {
      const res = await todosApi.create({ text: newTodo, priority, category });
      setTodos([res.data, ...todos]); setNewTodo('');
    } catch (e) { alert('Failed to add todo'); }
  };

  const toggleTodo = async (id, completed, e) => {
    e?.stopPropagation();
    try {
      await todosApi.update(id, { completed: !completed });
      setTodos(todos.map(t => t._id === id ? { ...t, completed: !completed } : t));
    } catch (e) { alert('Failed to update'); }
  };

  const deleteTodo = async (id, e) => {
    e?.stopPropagation();
    try { await todosApi.delete(id); setTodos(todos.filter(t => t._id !== id)); } catch (e) { alert('Failed to delete'); }
  };

  const openTodoDetail = async (todo) => {
    setSelectedTodo(todo);
    try { const res = await commentsApi.getAll(todo._id); setComments(res.data); } catch (e) { console.error(e); }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    try {
      const res = await commentsApi.create(selectedTodo._id, newComment);
      setComments([res.data, ...comments]); setNewComment('');
    } catch (e) { alert('Failed to add comment'); }
  };

  // Ticket functions
  const fetchTickets = async () => {
    try { 
      const res = await ticketsApi.getAll(); 
      setTicketsList(res.data);
      // Get unique clients
      const clients = [...new Set(res.data.map(t => t.client_name))];
      setClientsList(clients);
    } catch (e) { console.error(e); }
  };

  const createTicket = async () => {
    if (!newTicket.ticket_id || !newTicket.client_name || !newTicket.subject) return alert('Ticket ID, Client name and subject required');
    try {
      const res = await ticketsApi.create(newTicket);
      setTicketsList([res.data, ...ticketsList]);
      if (!clientsList.includes(newTicket.client_name)) setClientsList([...clientsList, newTicket.client_name]);
      setNewTicket({ ticket_id: '', client_name: '', subject: '', description: '', priority: 'medium' });
      setShowNewTicketForm(false);
    } catch (e) { alert(e.response?.data?.message || 'Failed to create ticket'); }
  };
  
  // Filter tickets
  const filteredTickets = ticketsList.filter(t => {
    if (ticketStatusFilter !== 'all' && t.status !== ticketStatusFilter) return false;
    if (ticketClientFilter !== 'all' && t.client_name !== ticketClientFilter) return false;
    if (ticketSearchQuery && !t.ticket_id.toLowerCase().includes(ticketSearchQuery.toLowerCase()) && 
        !t.subject.toLowerCase().includes(ticketSearchQuery.toLowerCase())) return false;
    return true;
  });

  const updateTicketStatus = async (id, status) => {
    try {
      console.log('Updating ticket:', id, 'to status:', status);
      await ticketsApi.update(id, { status });
      setTicketsList(ticketsList.map(t => t._id === id ? { ...t, status } : t));
      if (selectedTicket?._id === id) setSelectedTicket({ ...selectedTicket, status });
      console.log('Ticket updated successfully');
    } catch (e) { 
      console.error('Update error:', e.response?.data || e.message);
      alert(e.response?.data?.message || 'Failed to update ticket'); 
    }
  };

  const deleteTicket = async (id, e) => {
    e?.stopPropagation();
    try { await ticketsApi.delete(id); setTicketsList(ticketsList.filter(t => t._id !== id)); } catch (e) { alert('Failed to delete'); }
  };

  const openTicketDetail = async (ticket) => {
    setSelectedTicket(ticket);
    try { const res = await ticketCommentsApi.getAll(ticket._id); setTicketCommentsList(res.data); } catch (e) { console.error(e); }
  };

  const addTicketComment = async () => {
    if (!newTicketComment.trim()) return;
    try {
      const res = await ticketCommentsApi.create(selectedTicket._id, newTicketComment);
      setTicketCommentsList([res.data, ...ticketCommentsList]); setNewTicketComment('');
    } catch (e) { alert('Failed to add comment'); }
  };

  // Export functions
  const openExportModal = (type, format) => {
    setExportType(type);
    setExportFormat(format);
    setShowExportModal(true);
    // Set default dates (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    setExportStartDate(startDate.toISOString().split('T')[0]);
    setExportEndDate(endDate.toISOString().split('T')[0]);
  };

  const handleExportWithDateRange = async () => {
    try {
      let res;
      const startDate = exportStartDate ? new Date(exportStartDate).toISOString() : null;
      const endDate = exportEndDate ? new Date(exportEndDate).toISOString() : null;
      
      if (exportType === 'todos') {
        res = exportFormat === 'pdf' ? 
          await exportData.pdf(startDate, endDate) : 
          await exportData.excel(startDate, endDate);
      } else {
        res = exportFormat === 'pdf' ? 
          await exportData.ticketsPdf(startDate, endDate) : 
          await exportData.ticketsExcel(startDate, endDate);
      }
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a'); 
      link.href = url;
      const fileName = `${exportType}_${exportStartDate || 'all'}_to_${exportEndDate || 'all'}.${exportFormat === 'pdf' ? 'pdf' : 'xlsx'}`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link); 
      link.click(); 
      link.remove();
      setShowExportModal(false);
    } catch (e) { 
      alert(`Failed to export ${exportFormat.toUpperCase()}`); 
    }
  };

  const handleExport = async (type) => openExportModal('todos', type);
  const handleTicketsExport = async (type) => openExportModal('tickets', type);

  // Analytics functions
  const fetchStats = async () => {
    try {
      const res = await analytics.getStats();
      setStats(res.data);
    } catch (e) {
      console.error('Failed to fetch stats:', e);
    }
  };

  const fetchActivities = async () => {
    try {
      const res = await activitiesApi.getAll(20);
      setActivities(res.data);
    } catch (e) {
      console.error('Failed to fetch activities:', e);
    }
  };

  // Time tracking functions
  const startTimer = async (todoId) => {
    try {
      await timeTracking.start(todoId);
      setActiveTimer(todoId);
      setTimerSeconds(0);
      fetchActivities(); // Refresh activities
    } catch (e) {
      alert('Failed to start timer');
    }
  };

  const stopTimer = async () => {
    if (!activeTimer) return;
    try {
      await timeTracking.stop(activeTimer);
      setActiveTimer(null);
      setTimerSeconds(0);
      fetchTodos(); // Refresh todos to get updated time
      fetchActivities(); // Refresh activities
      fetchStats(); // Refresh stats
    } catch (e) {
      alert('Failed to stop timer');
    }
  };

  // AI functions
  const getAISuggestions = async () => {
    setAiLoading(true);
    try {
      const res = await ai.getSuggestions(aiContext);
      
      // Handle both success and fallback responses
      if (res.data.suggestions) {
        setAiSuggestions(res.data.suggestions);
        setShowAISuggestions(true);
        
        // Show message if it's fallback suggestions
        if (res.data.fallback) {
          alert('AI service temporarily unavailable. Showing fallback suggestions.');
        }
      } else {
        setAiSuggestions([]);
        setShowAISuggestions(true);
      }
    } catch (e) {
      console.error('AI Suggestions Error:', e.response?.data);
      
      // If server returns fallback suggestions even in error case
      if (e.response?.data?.suggestions) {
        setAiSuggestions(e.response.data.suggestions);
        setShowAISuggestions(true);
        
        // Show appropriate message based on error type
        if (e.response.data.setup_required) {
          alert('AI API key not configured. Please set it in Profile Settings. Showing fallback suggestions for now.');
        } else {
          alert(e.response.data.message || 'Using fallback suggestions');
        }
      } else {
        const errorMessage = e.response?.data?.message || 'Failed to get AI suggestions';
        alert(errorMessage);
        
        // Show fallback suggestions even if server didn't provide them
        const fallbackSuggestions = [
          {
            text: "Review your current task list",
            category: "work",
            priority: "medium",
            reasoning: "Stay organized and focused"
          },
          {
            text: "Take a short break",
            category: "health",
            priority: "low",
            reasoning: "Rest is important for productivity"
          }
        ];
        setAiSuggestions(fallbackSuggestions);
        setShowAISuggestions(true);
      }
    } finally {
      setAiLoading(false);
    }
  };

  const addAISuggestion = async (suggestion) => {
    try {
      const res = await todosApi.create({
        text: suggestion.text,
        priority: suggestion.priority,
        category: suggestion.category
      });
      setTodos([res.data, ...todos]);
      // Remove suggestion from list
      setAiSuggestions(aiSuggestions.filter(s => s.text !== suggestion.text));
    } catch (e) {
      alert('Failed to add suggested task');
    }
  };

  // Advanced AI functions
  const generateDailyPlan = async () => {
    setAiLoading(true);
    try {
      const res = await ai.planDay(8, 'medium', ['work', 'personal']);
      setAiPlan(res.data);
      setShowAIPlanner(true);
    } catch (e) {
      console.error('Daily plan error:', e);
      alert('Failed to generate daily plan: ' + (e.response?.data?.message || e.message));
    } finally {
      setAiLoading(false);
    }
  };

  const optimizeWorkflow = async () => {
    setAiLoading(true);
    try {
      const res = await ai.optimizeWorkflow();
      setWorkflowOptimization(res.data);
      setShowWorkflowOptimizer(true);
    } catch (e) {
      console.error('Workflow optimization error:', e);
      alert('Failed to optimize workflow: ' + (e.response?.data?.message || e.message));
    } finally {
      setAiLoading(false);
    }
  };

  const getSmartSuggestions = async () => {
    setAiLoading(true);
    try {
      const res = await ai.getSmartSuggestions(currentContext, currentMood, availableTime);
      setSmartSuggestions(res.data.suggestions || []);
      setShowSmartSuggestions(true);
    } catch (e) {
      console.error('Smart suggestions error:', e);
      alert('Failed to get smart suggestions: ' + (e.response?.data?.message || e.message));
    } finally {
      setAiLoading(false);
    }
  };

  // Profile functions
  const fetchProfile = async () => {
    setProfileLoading(true);
    try {
      const res = await userProfile.get();
      setProfileData(res.data);
    } catch (e) {
      alert('Failed to fetch profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const updateProfile = async (updatedData) => {
    try {
      await userProfile.update(updatedData);
      setProfileData({...profileData, ...updatedData});
      // Update user in localStorage
      const updatedUser = {...user, ...updatedData};
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      alert('Profile updated successfully');
      fetchActivities(); // Refresh activities
    } catch (e) {
      alert('Failed to update profile');
    }
  };

  const changePassword = async (passwordData) => {
    try {
      await userProfile.changePassword(passwordData);
      alert('Password changed successfully');
      fetchActivities(); // Refresh activities
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to change password');
    }
  };

  const filteredTodos = todos.filter(t => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  }).filter(t => t.text.toLowerCase().includes(searchQuery.toLowerCase()));

  const getPriorityColor = (p) => ({ high: 'border-l-red-500', medium: 'border-l-yellow-500', low: 'border-l-green-500' }[p] || 'border-l-gray-500');
  const getStatusColor = (s) => ({ open: 'bg-blue-100 text-blue-700', 'in-progress': 'bg-yellow-100 text-yellow-700', resolved: 'bg-green-100 text-green-700', closed: 'bg-gray-100 text-gray-700' }[s] || 'bg-gray-100');
  const formatDate = (d) => new Date(d).toLocaleDateString();
  const formatTime = (d) => new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  // Profile Settings Component
  const ProfileSettings = ({ profileData, onUpdateProfile, onChangePassword }) => {
    const [activeTab, setActiveTab] = useState('profile');
    const [formData, setFormData] = useState({
      name: profileData.name || '',
      email: profileData.email || '',
      mobile: profileData.mobile || '',
      timezone: profileData.timezone || 'UTC',
      theme: profileData.theme || 'light'
    });
    const [notifications, setNotifications] = useState(profileData.notifications || {
      email: true,
      push: true,
      reminders: true
    });
    const [preferences, setPreferences] = useState(profileData.preferences || {
      default_priority: 'medium',
      default_category: 'personal',
      auto_archive: false,
      show_completed: true
    });
    const [apiSettings, setApiSettings] = useState(profileData.api_settings || {
      ai_provider: 'gemini',
      gemini_api_key: '',
      openai_api_key: '',
      claude_api_key: '',
      custom_api_endpoint: '',
      custom_api_key: ''
    });
    const [passwordData, setPasswordData] = useState({
      current_password: '',
      new_password: '',
      confirm_password: ''
    });
    const [showApiKey, setShowApiKey] = useState(false);

    const handleSaveProfile = () => {
      onUpdateProfile({
        ...formData,
        notifications,
        preferences,
        api_settings: apiSettings
      });
    };

    const handleChangePassword = () => {
      if (passwordData.new_password !== passwordData.confirm_password) {
        alert('New passwords do not match');
        return;
      }
      onChangePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    };

    return (
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 mb-6 border border-gray-100/50">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{profileData.name || 'User'}</h2>
              <p className="text-gray-500">{profileData.email}</p>
              <p className="text-xs text-gray-400">Member since {formatDate(profileData.created_at)}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-100/50 mb-6">
          <div className="flex border-b border-gray-200">
            {[
              { id: 'profile', label: 'Profile', icon: User },
              { id: 'preferences', label: 'Preferences', icon: Settings },
              { id: 'api', label: 'API Settings', icon: Zap },
              { id: 'security', label: 'Security', icon: Settings }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id 
                    ? 'text-indigo-600 border-b-2 border-indigo-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                    <input
                      type="tel"
                      value={formData.mobile}
                      onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
                    <select
                      value={formData.theme}
                      onChange={(e) => setFormData({...formData, theme: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="auto">Auto</option>
                    </select>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Notifications</h4>
                  <div className="space-y-2">
                    {Object.entries(notifications).map(([key, value]) => (
                      <label key={key} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => setNotifications({...notifications, [key]: e.target.checked})}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm capitalize">{key.replace('_', ' ')} notifications</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button onClick={handleSaveProfile} className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save Profile
                </button>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Default Priority</label>
                    <select
                      value={preferences.default_priority}
                      onChange={(e) => setPreferences({...preferences, default_priority: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Default Category</label>
                    <select
                      value={preferences.default_category}
                      onChange={(e) => setPreferences({...preferences, default_category: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="personal">Personal</option>
                      <option value="work">Work</option>
                      <option value="shopping">Shopping</option>
                      <option value="health">Health</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={preferences.auto_archive}
                      onChange={(e) => setPreferences({...preferences, auto_archive: e.target.checked})}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm">Auto-archive completed tasks after 30 days</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={preferences.show_completed}
                      onChange={(e) => setPreferences({...preferences, show_completed: e.target.checked})}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm">Show completed tasks by default</span>
                  </label>
                </div>

                <button onClick={handleSaveProfile} className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save Preferences
                </button>
              </div>
            )}

            {/* API Settings Tab */}
            {activeTab === 'api' && (
              <div className="space-y-6">
                {/* AI Provider Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">AI Provider</label>
                  <select
                    value={apiSettings.ai_provider}
                    onChange={(e) => setApiSettings({...apiSettings, ai_provider: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="gemini">Google Gemini (Free)</option>
                    <option value="openai">OpenAI GPT (Paid)</option>
                    <option value="claude">Anthropic Claude (Paid)</option>
                    <option value="custom">Custom API</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Choose your preferred AI provider for task suggestions</p>
                </div>

                {/* Provider-specific API Key Fields */}
                {apiSettings.ai_provider === 'gemini' && (
                  <form onSubmit={(e) => { e.preventDefault(); handleSaveProfile(); }}>
                    <div>
                      <label htmlFor="gemini-api-key" className="block text-sm font-medium text-gray-700 mb-1">Gemini API Key</label>
                      <div className="relative">
                        <input
                          id="gemini-api-key"
                          name="gemini-api-key"
                          type={showApiKey ? "text" : "password"}
                          value={apiSettings.gemini_api_key}
                          onChange={(e) => setApiSettings({...apiSettings, gemini_api_key: e.target.value})}
                          placeholder="Enter your Gemini API key"
                          className="w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                          autoComplete="off"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                        >
                          {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Get your free API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Google AI Studio</a>
                      </p>
                    </div>
                  </form>
                )}

                {apiSettings.ai_provider === 'openai' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">OpenAI API Key</label>
                    <div className="relative">
                      <input
                        type={showApiKey ? "text" : "password"}
                        value={apiSettings.openai_api_key}
                        onChange={(e) => setApiSettings({...apiSettings, openai_api_key: e.target.value})}
                        placeholder="Enter your OpenAI API key"
                        className="w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                      >
                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">OpenAI Platform</a>
                    </p>
                  </div>
                )}

                {apiSettings.ai_provider === 'claude' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Claude API Key</label>
                    <div className="relative">
                      <input
                        type={showApiKey ? "text" : "password"}
                        value={apiSettings.claude_api_key}
                        onChange={(e) => setApiSettings({...apiSettings, claude_api_key: e.target.value})}
                        placeholder="Enter your Claude API key"
                        className="w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                      >
                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Get your API key from <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Anthropic Console</a>
                    </p>
                  </div>
                )}

                {apiSettings.ai_provider === 'custom' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Custom API Endpoint</label>
                      <input
                        type="url"
                        value={apiSettings.custom_api_endpoint}
                        onChange={(e) => setApiSettings({...apiSettings, custom_api_endpoint: e.target.value})}
                        placeholder="https://your-custom-api.com/v1/chat"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Custom API Key</label>
                      <div className="relative">
                        <input
                          type={showApiKey ? "text" : "password"}
                          value={apiSettings.custom_api_key}
                          onChange={(e) => setApiSettings({...apiSettings, custom_api_key: e.target.value})}
                          placeholder="Enter your custom API key"
                          className="w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                        >
                          {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Provider Information */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Provider Information</h4>
                  {apiSettings.ai_provider === 'gemini' && (
                    <div className="text-sm text-blue-800">
                      <p>• Free tier available with generous limits</p>
                      <p>• Best for general task suggestions</p>
                      <p>• Fast response times</p>
                    </div>
                  )}
                  {apiSettings.ai_provider === 'openai' && (
                    <div className="text-sm text-blue-800">
                      <p>• Pay-per-use pricing</p>
                      <p>• High-quality responses</p>
                      <p>• Good for complex task analysis</p>
                    </div>
                  )}
                  {apiSettings.ai_provider === 'claude' && (
                    <div className="text-sm text-blue-800">
                      <p>• Pay-per-use pricing</p>
                      <p>• Excellent for detailed analysis</p>
                      <p>• Strong reasoning capabilities</p>
                    </div>
                  )}
                  {apiSettings.ai_provider === 'custom' && (
                    <div className="text-sm text-blue-800">
                      <p>• Use your own AI service</p>
                      <p>• Full control over data and privacy</p>
                      <p>• Requires compatible API format</p>
                    </div>
                  )}
                </div>

                <button onClick={handleSaveProfile} className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save AI Settings
                </button>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Change Password</h4>
                <form onSubmit={(e) => { e.preventDefault(); handleChangePassword(); }} className="space-y-3">
                  <div>
                    <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                    <input
                      id="current-password"
                      name="current-password"
                      type="password"
                      value={passwordData.current_password}
                      onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                      autoComplete="current-password"
                    />
                  </div>
                  <div>
                    <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <input
                      id="new-password"
                      name="new-password"
                      type="password"
                      value={passwordData.new_password}
                      onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                      autoComplete="new-password"
                    />
                  </div>
                  <div>
                    <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                    <input
                      id="confirm-password"
                      name="confirm-password"
                      type="password"
                      value={passwordData.confirm_password}
                      onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                      autoComplete="new-password"
                    />
                  </div>
                  
                  <button 
                    type="submit"
                    disabled={!passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Change Password
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center w-full overflow-x-hidden">
      <div className="animate-pulse p-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl">
        <Check className="w-8 h-8 text-white" />
      </div>
    </div>
  );

  if (!user) return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4 w-full overflow-x-hidden">
      <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-md border border-gray-100">
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl mb-4">
            <Check className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">To Do App</h1>
          <p className="text-gray-500 mt-2">Manage Your Tasks Efficiently</p>
        </div>
        <div className="space-y-4">
          {isSignUp && (
            <div>
              <label htmlFor="name-input" className="sr-only">Full Name</label>
              <input 
                id="name-input"
                name="name"
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none" 
                placeholder="Full Name"
                autoComplete="name"
                required
              />
            </div>
          )}
          <div>
            <label htmlFor="email-input" className="sr-only">Email Address</label>
            <input 
              id="email-input"
              name="email"
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none" 
              placeholder="Email"
              autoComplete="email"
              required
            />
          </div>
          {isSignUp && (
            <div>
              <label htmlFor="mobile-input" className="sr-only">Mobile Number</label>
              <input 
                id="mobile-input"
                name="mobile"
                type="tel" 
                value={mobile} 
                onChange={(e) => setMobile(e.target.value)} 
                onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none" 
                placeholder="Mobile Number (Optional)"
                autoComplete="tel"
              />
            </div>
          )}
          <div>
            <label htmlFor="password-input" className="sr-only">Password</label>
            <input 
              id="password-input"
              name="password"
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none" 
              placeholder="Password"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              required
            />
          </div>
          <button onClick={handleAuth} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl font-medium hover:from-indigo-600 hover:to-purple-700 transition shadow-lg">
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
        <button onClick={() => setIsSignUp(!isSignUp)} className="w-full mt-4 text-indigo-600 text-sm">
          {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
        </button>
      </div>
    </div>
  );


  // Sidebar Menu Component
  const SidebarMenu = () => {
    const menuRef = useRef(null);
    
    useEffect(() => {
      const handleClickOutside = (e) => {
        if (menuRef.current && !menuRef.current.contains(e.target)) {
          setSidebarOpen(false);
        }
      };
      if (sidebarOpen) document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [sidebarOpen]);

    return (
      <>
        {/* Overlay */}
        {sidebarOpen && <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setSidebarOpen(false)} />}
        
        {/* Sidebar */}
        <div ref={menuRef} className={`fixed top-0 left-0 h-full w-64 sm:w-72 bg-white/95 backdrop-blur-md shadow-xl z-50 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} max-w-[80vw]`}>
          {/* Header */}
          <div className="p-4 border-b border-gray-100/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-gray-900">To Do App</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="p-3 space-y-1">
            <button onClick={() => navigateTo('dashboard')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${currentPage === 'dashboard' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-gray-700 hover:bg-gray-50'}`}>
              <Home className="w-4 h-4" /> Dashboard
            </button>
            <button onClick={() => navigateTo('todos')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${currentPage === 'todos' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-gray-700 hover:bg-gray-50'}`}>
              <ListTodo className="w-4 h-4" /> To Do List
            </button>
            <button onClick={() => navigateTo('tickets')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${currentPage === 'tickets' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-gray-700 hover:bg-gray-50'}`}>
              <Ticket className="w-4 h-4" /> Tickets
            </button>
            <button onClick={() => navigateTo('analytics')} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${currentPage === 'analytics' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-gray-700 hover:bg-gray-50'}`}>
              <BarChart3 className="w-4 h-4" /> Analytics
            </button>
            <button onClick={() => { navigateTo('profile'); fetchProfile(); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${currentPage === 'profile' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-gray-700 hover:bg-gray-50'}`}>
              <Settings className="w-4 h-4" /> Profile & Settings
            </button>
          </nav>
          
          {/* User Section - Bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100/50 bg-white/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user.name || user.email.split('@')[0]}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </>
    );
  };

  // Header Component
  const Header = ({ title, children }) => (
    <div className="bg-white/80 backdrop-blur-md border-b border-gray-100/50 fixed top-0 left-0 right-0 z-50 px-3 sm:px-4 py-3 flex items-center gap-2 sm:gap-4 w-full">
      <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0">
        <Menu className="w-5 h-5 text-gray-600" />
      </button>
      <button onClick={() => navigateTo('dashboard')} className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0">
        <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl">
          <Check className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold text-gray-900 hidden sm:block text-sm">To Do App</span>
      </button>
      <h1 className="text-base sm:text-lg font-medium flex-1 text-gray-700 truncate min-w-0">{title}</h1>
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        {children}
      </div>
    </div>
  );

  // Todo Detail View
  if (selectedTodo) return (
    <div className="min-h-screen min-h-[100dvh] bg-gray-50 w-full overflow-x-hidden">
      <div className="bg-white border-b fixed top-0 left-0 right-0 z-50 px-3 sm:px-4 py-3 flex items-center gap-2 sm:gap-4">
        <button onClick={() => setSelectedTodo(null)} className="p-2 hover:bg-gray-100 rounded-xl"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex-1">
          <h1 className="font-bold truncate">{selectedTodo.text}</h1>
          <p className="text-xs text-gray-500">{selectedTodo.category} • {selectedTodo.priority}</p>
        </div>
        <button onClick={(e) => { toggleTodo(selectedTodo._id, selectedTodo.completed, e); setSelectedTodo({...selectedTodo, completed: !selectedTodo.completed}); }}
          className={`px-3 py-1.5 rounded-lg text-sm ${selectedTodo.completed ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
          {selectedTodo.completed ? '✓ Done' : 'Mark Done'}
        </button>
      </div>
      <div className="max-w-4xl mx-auto p-3 sm:p-4 space-y-3 sm:space-y-4 w-full" style={{marginTop: '80px'}}>
        <div className={`bg-white rounded-xl p-3 sm:p-4 border-l-4 ${getPriorityColor(selectedTodo.priority)}`}>
          <h2 className="font-semibold text-lg">{selectedTodo.text}</h2>
          <p className="text-sm text-gray-500 mt-1">Created {formatDate(selectedTodo.created_at)}</p>
        </div>
        <div className="bg-white rounded-xl p-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <label htmlFor="todo-comment-input" className="sr-only">Add Comment</label>
              <input 
                id="todo-comment-input"
                name="todoComment"
                value={newComment} 
                onChange={(e) => setNewComment(e.target.value)} 
                onKeyPress={(e) => e.key === 'Enter' && addComment()}
                placeholder="Add comment..." 
                className="w-full px-3 py-2 border rounded-lg"
                autoComplete="off"
              />
            </div>
            <button 
              onClick={addComment} 
              className="px-4 py-2 bg-indigo-500 text-white rounded-lg"
              aria-label="Send comment"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 space-y-3">
          <h3 className="font-semibold flex items-center gap-2"><MessageCircle className="w-4 h-4" /> Comments</h3>
          {comments.length === 0 ? <p className="text-gray-500 text-center py-4">No comments yet</p> :
            comments.map(c => (
              <div key={c._id} className="bg-gray-50 rounded-lg p-3">
                <p>{c.text}</p>
                <p className="text-xs text-gray-500 mt-1">{c.user_email} • {formatTime(c.created_at)}</p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );

  // Ticket Detail View
  if (selectedTicket) return (
    <div className="min-h-screen min-h-[100dvh] bg-gray-50 w-full overflow-x-hidden">
      <div className="bg-white border-b fixed top-0 left-0 right-0 z-50 px-3 sm:px-4 py-3 flex items-center gap-2 sm:gap-4">
        <button onClick={() => setSelectedTicket(null)} className="p-2 hover:bg-gray-100 rounded-xl"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex-1">
          <h1 className="font-bold">{selectedTicket.ticket_id}</h1>
          <p className="text-xs text-gray-500">{selectedTicket.client_name}</p>
        </div>
        <div>
          <label htmlFor="ticket-status-select" className="sr-only">Update Ticket Status</label>
          <select 
            id="ticket-status-select"
            name="ticketStatus"
            value={selectedTicket.status} 
            onChange={(e) => updateTicketStatus(selectedTicket._id, e.target.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${getStatusColor(selectedTicket.status)}`}
          >
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>
      <div className="max-w-4xl mx-auto p-3 sm:p-4 space-y-3 sm:space-y-4 w-full" style={{marginTop: '80px'}}>
        <div className={`bg-white rounded-xl p-3 sm:p-4 border-l-4 ${getPriorityColor(selectedTicket.priority)}`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{selectedTicket.ticket_id}</span>
            <span className={`text-xs px-2 py-1 rounded ${getStatusColor(selectedTicket.status)}`}>{selectedTicket.status}</span>
          </div>
          <h2 className="font-semibold text-lg">{selectedTicket.subject}</h2>
          <p className="text-gray-600 mt-2">{selectedTicket.description}</p>
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
            <span className="flex items-center gap-1"><User className="w-4 h-4" /> {selectedTicket.client_name}</span>
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {formatDate(selectedTicket.created_at)}</span>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <label htmlFor="ticket-comment-input" className="sr-only">Add Update</label>
              <input 
                id="ticket-comment-input"
                name="ticketComment"
                value={newTicketComment} 
                onChange={(e) => setNewTicketComment(e.target.value)} 
                onKeyPress={(e) => e.key === 'Enter' && addTicketComment()}
                placeholder="Add update..." 
                className="w-full px-3 py-2 border rounded-lg"
                autoComplete="off"
              />
            </div>
            <button 
              onClick={addTicketComment} 
              className="px-4 py-2 bg-indigo-500 text-white rounded-lg"
              aria-label="Send update"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 space-y-3">
          <h3 className="font-semibold flex items-center gap-2"><MessageCircle className="w-4 h-4" /> Updates</h3>
          {ticketCommentsList.length === 0 ? <p className="text-gray-500 text-center py-4">No updates yet</p> :
            ticketCommentsList.map(c => (
              <div key={c._id} className="bg-gray-50 rounded-lg p-3">
                <p>{c.text}</p>
                <p className="text-xs text-gray-500 mt-1">{c.user_email} • {formatTime(c.created_at)}</p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );


  // Main Dashboard Layout
  return (
    <div className="min-h-screen min-h-[100dvh] w-full overflow-x-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <SidebarMenu />
        {currentPage === 'dashboard' && (
          <>
            <Header title="Dashboard" />
            <div className="px-3 sm:px-4 py-3 w-full overflow-x-hidden pt-20">
              {/* Welcome Section */}
              <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl p-5 text-white mb-5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
                <div className="relative">
                  <h2 className="text-xl font-semibold mb-1">Welcome back, {user.email.split('@')[0]}!</h2>
                  <p className="text-sm opacity-80">Here's your productivity overview</p>
                </div>
              </div>

              {/* Enhanced Stats Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 mb-4 sm:mb-5">
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-gray-100/50 hover:shadow-sm transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                      <ListTodo className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-900">{todos.length}</p>
                      <p className="text-xs text-gray-500">Tasks</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-gray-100/50 hover:shadow-sm transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                      <Clock className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-900">{todos.filter(t => !t.completed).length}</p>
                      <p className="text-xs text-gray-500">Pending</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-gray-100/50 hover:shadow-sm transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                      <Check className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-900">{todos.filter(t => t.completed).length}</p>
                      <p className="text-xs text-gray-500">Completed</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-gray-100/50 hover:shadow-sm transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                      <Ticket className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-900">{ticketsList.length}</p>
                      <p className="text-xs text-gray-500">Tickets</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-gray-100/50 hover:shadow-sm transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-900">{stats?.completion_rate || 0}%</p>
                      <p className="text-xs text-gray-500">Success Rate</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-gray-100/50 hover:shadow-sm transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                      <Clock className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-900">{Math.floor((stats?.total_time_minutes || 0) / 60)}h</p>
                      <p className="text-xs text-gray-500">Time Spent</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-5">
                {/* Recent Tasks */}
                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-100/50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-900">Recent Tasks</h3>
                    <button onClick={() => navigateTo('todos')} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">View All</button>
                  </div>
                  <div className="space-y-2">
                    {todos.slice(0, 4).map(todo => (
                      <div key={todo._id} className="flex items-center gap-2 p-2 hover:bg-white/50 rounded-lg transition-colors">
                        <div className={`w-2 h-2 rounded-full ${todo.completed ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs truncate ${todo.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>{todo.text}</p>
                          <p className="text-xs text-gray-400">{todo.category}</p>
                        </div>
                        <span className={`text-xs px-1.5 py-0.5 rounded-md ${
                          todo.priority === 'high' ? 'bg-red-50 text-red-600' : 
                          todo.priority === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'
                        }`}>
                          {todo.priority}
                        </span>
                      </div>
                    ))}
                    {todos.length === 0 && <p className="text-gray-400 text-center py-3 text-xs">No tasks yet</p>}
                  </div>
                </div>

                {/* Recent Tickets */}
                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-100/50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-900">Recent Tickets</h3>
                    <button onClick={() => navigateTo('tickets')} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">View All</button>
                  </div>
                  <div className="space-y-2">
                    {ticketsList.slice(0, 4).map(ticket => (
                      <div key={ticket._id} className="p-2 hover:bg-white/50 rounded-lg transition-colors">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{ticket.ticket_id}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-md ${getStatusColor(ticket.status)}`}>{ticket.status}</span>
                        </div>
                        <p className="text-xs text-gray-700 truncate">{ticket.subject}</p>
                        <p className="text-xs text-gray-400">{ticket.client_name}</p>
                      </div>
                    ))}
                    {ticketsList.length === 0 && <p className="text-gray-400 text-center py-3 text-xs">No tickets yet</p>}
                  </div>
                </div>
                
                {/* Activity Feed */}
                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-100/50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-900">Recent Activity</h3>
                  </div>
                  <div className="space-y-2">
                    {/* Combine todos and tickets for activity feed */}
                    {[...todos.slice(0, 2).map(t => ({...t, type: 'todo'})), ...ticketsList.slice(0, 2).map(t => ({...t, type: 'ticket'}))].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 4).map((item, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 hover:bg-white/50 rounded-lg transition-colors">
                        <div className={`w-2 h-2 rounded-full ${item.type === 'todo' ? 'bg-blue-500' : 'bg-purple-500'}`}></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-700 truncate">
                            {item.type === 'todo' ? `Task: ${item.text}` : `Ticket: ${item.subject}`}
                          </p>
                          <p className="text-xs text-gray-400">{formatDate(item.created_at)}</p>
                        </div>
                      </div>
                    ))}
                    {todos.length === 0 && ticketsList.length === 0 && <p className="text-gray-400 text-center py-3 text-xs">No activity yet</p>}
                  </div>
                </div>
              </div>

              {/* Progress Section */}
              <div className="grid lg:grid-cols-2 gap-4 mb-5">
                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-100/50">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Task Progress</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600">Completed Tasks</span>
                        <span className="text-gray-900">{todos.filter(t => t.completed).length}/{todos.length}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-gradient-to-r from-emerald-500 to-green-600 h-2 rounded-full transition-all" 
                             style={{width: `${todos.length ? (todos.filter(t => t.completed).length / todos.length) * 100 : 0}%`}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600">High Priority</span>
                        <span className="text-red-600">{todos.filter(t => t.priority === 'high').length}</span>
                      </div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600">Medium Priority</span>
                        <span className="text-amber-600">{todos.filter(t => t.priority === 'medium').length}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Low Priority</span>
                        <span className="text-green-600">{todos.filter(t => t.priority === 'low').length}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-100/50">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Ticket Status</h3>
                  <div className="space-y-2">
                    {['open', 'in-progress', 'resolved', 'closed'].map(status => {
                      const count = ticketsList.filter(t => t.status === status).length;
                      const percentage = ticketsList.length ? (count / ticketsList.length) * 100 : 0;
                      return (
                        <div key={status} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              status === 'open' ? 'bg-blue-500' : 
                              status === 'in-progress' ? 'bg-yellow-500' : 
                              status === 'resolved' ? 'bg-green-500' : 'bg-gray-500'
                            }`}></div>
                            <span className="text-xs text-gray-600 capitalize">{status.replace('-', ' ')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-1">
                              <div className={`h-1 rounded-full transition-all ${
                                status === 'open' ? 'bg-blue-500' : 
                                status === 'in-progress' ? 'bg-yellow-500' : 
                                status === 'resolved' ? 'bg-green-500' : 'bg-gray-500'
                              }`} style={{width: `${percentage}%`}}></div>
                            </div>
                            <span className="text-xs font-medium text-gray-900 w-6">{count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Active Timer */}
              {activeTimer && (
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 mb-4 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                        <Play className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium">Timer Running</h3>
                        <p className="text-xs opacity-80">{Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}</p>
                      </div>
                    </div>
                    <button onClick={stopTimer} className="px-3 py-1.5 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                      <Pause className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <button onClick={() => navigateTo('todos')} className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 text-left hover:shadow-lg hover:scale-[1.02] transition-all text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <Plus className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Add New Task</h3>
                      <p className="text-xs opacity-80">Create a todo item</p>
                    </div>
                  </div>
                </button>
                <button onClick={() => navigateTo('tickets')} className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-4 text-left hover:shadow-lg hover:scale-[1.02] transition-all text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <Ticket className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Create Ticket</h3>
                      <p className="text-xs opacity-80">Track client issues</p>
                    </div>
                  </div>
                </button>
                <button onClick={() => navigateTo('analytics')} className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl p-4 text-left hover:shadow-lg hover:scale-[1.02] transition-all text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">View Analytics</h3>
                      <p className="text-xs opacity-80">Performance insights</p>
                    </div>
                  </div>
                </button>
                <button onClick={getAISuggestions} disabled={aiLoading} className="bg-gradient-to-r from-orange-500 to-red-600 rounded-xl p-4 text-left hover:shadow-lg hover:scale-[1.02] transition-all text-white disabled:opacity-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">{aiLoading ? 'Getting...' : 'AI Suggestions'}</h3>
                      <p className="text-xs opacity-80">Smart task ideas</p>
                    </div>
                  </div>
                </button>
              </div>

              {/* Advanced AI Features */}
              <div className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 rounded-2xl p-5 text-white mb-5">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  AI-Powered Productivity
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button 
                    onClick={generateDailyPlan} 
                    disabled={aiLoading}
                    className="bg-white/10 hover:bg-white/20 rounded-lg p-3 text-left transition-all disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium">Daily Planner</span>
                    </div>
                    <p className="text-xs opacity-80">AI-optimized schedule</p>
                  </button>
                  
                  <button 
                    onClick={optimizeWorkflow} 
                    disabled={aiLoading}
                    className="bg-white/10 hover:bg-white/20 rounded-lg p-3 text-left transition-all disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm font-medium">Workflow Optimizer</span>
                    </div>
                    <p className="text-xs opacity-80">Productivity analysis</p>
                  </button>
                  
                  <button 
                    onClick={getSmartSuggestions} 
                    disabled={aiLoading}
                    className="bg-white/10 hover:bg-white/20 rounded-lg p-3 text-left transition-all disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="w-4 h-4" />
                      <span className="text-sm font-medium">Smart Suggestions</span>
                    </div>
                    <p className="text-xs opacity-80">Context-aware tips</p>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {currentPage === 'todos' && (
          <>
            <Header title="To Do List">
              <button onClick={() => handleExport('pdf')} className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Export PDF"><FileText className="w-4 h-4 sm:w-5 sm:h-5" /></button>
              <button onClick={() => handleExport('excel')} className="p-1.5 sm:p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Export Excel"><FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5" /></button>
            </Header>
            <div className="px-3 sm:px-4 py-3 w-full overflow-x-hidden pt-20">
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 text-center border border-gray-100/50">
                  <p className="text-xl font-semibold text-gray-900">{todos.length}</p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 text-center border border-gray-100/50">
                  <p className="text-xl font-semibold text-indigo-600">{todos.filter(t => !t.completed).length}</p>
                  <p className="text-xs text-gray-500">Active</p>
                </div>
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 text-center border border-gray-100/50">
                  <p className="text-xl font-semibold text-emerald-600">{todos.filter(t => t.completed).length}</p>
                  <p className="text-xs text-gray-500">Done</p>
                </div>
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 text-center border border-gray-100/50">
                  <p className="text-xl font-semibold text-red-600">{todos.filter(t => t.priority === 'high' && !t.completed).length}</p>
                  <p className="text-xs text-gray-500">High Priority</p>
                </div>
              </div>

              {/* Add Todo */}
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 mb-4 border border-gray-100/50">
                <div className="flex gap-2 mb-3">
                  <div className="flex-1">
                    <label htmlFor="new-todo-input" className="sr-only">New Task</label>
                    <input 
                      id="new-todo-input"
                      name="newTodo"
                      value={newTodo} 
                      onChange={(e) => setNewTodo(e.target.value)} 
                      onKeyPress={(e) => e.key === 'Enter' && addTodo()}
                      placeholder="What needs to be done?" 
                      className="w-full px-3 py-2 border-0 bg-white/70 rounded-lg text-sm sm:text-base focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all min-w-0"
                      autoComplete="off"
                    />
                  </div>
                  <button 
                    onClick={addTodo} 
                    className="px-3 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:shadow-md transition-all"
                    aria-label="Add new task"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <div>
                    <label htmlFor="priority-select" className="sr-only">Priority Level</label>
                    <select 
                      id="priority-select"
                      name="priority"
                      value={priority} 
                      onChange={(e) => setPriority(e.target.value)} 
                      className="px-2 py-1.5 border-0 bg-white/70 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="category-select" className="sr-only">Category</label>
                    <select 
                      id="category-select"
                      name="category"
                      value={category} 
                      onChange={(e) => setCategory(e.target.value)} 
                      className="px-2 py-1.5 border-0 bg-white/70 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="personal">Personal</option>
                      <option value="work">Work</option>
                      <option value="shopping">Shopping</option>
                      <option value="health">Health</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <div className="flex-1 relative">
                  <label htmlFor="search-tasks" className="sr-only">Search Tasks</label>
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    id="search-tasks"
                    name="searchQuery"
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    placeholder="Search tasks..."
                    className="w-full pl-9 pr-3 py-2 border-0 bg-white/60 backdrop-blur-sm rounded-lg text-sm sm:text-base focus:ring-2 focus:ring-indigo-500/20 focus:bg-white/80 transition-all min-w-0"
                    autoComplete="off"
                  />
                </div>
                <div className="flex bg-white/60 backdrop-blur-sm border border-gray-100/50 rounded-lg p-1">
                  {['all', 'active', 'completed'].map(f => (
                    <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded text-xs font-medium transition-all ${filter === f ? 'bg-indigo-500 text-white shadow-sm' : 'text-gray-600 hover:bg-white/50'}`}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Todo List */}
              <div className="space-y-2">
                {filteredTodos.length === 0 ? (
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 text-center text-gray-500 border border-gray-100/50">No tasks found</div>
                ) : filteredTodos.map(todo => (
                  <div key={todo._id} onClick={() => openTodoDetail(todo)}
                    className={`bg-white/60 backdrop-blur-sm rounded-xl p-3 border-l-4 ${getPriorityColor(todo.priority)} cursor-pointer hover:bg-white/80 hover:shadow-sm transition-all group border border-gray-100/50`}>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={(e) => toggleTodo(todo._id, todo.completed, e)}
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${todo.completed ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 hover:border-indigo-400'}`}
                        aria-label={todo.completed ? 'Mark as incomplete' : 'Mark as complete'}
                      >
                        {todo.completed && <Check className="w-2.5 h-2.5 text-white" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${todo.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>{todo.text}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{todo.category} • {formatDate(todo.created_at)}</span>
                          {todo.time_spent > 0 && (
                            <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                              {Math.floor(todo.time_spent / 60)}h {todo.time_spent % 60}m
                            </span>
                          )}
                          {activeTimer === todo._id && (
                            <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded animate-pulse">
                              Running
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        {!todo.completed && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              activeTimer === todo._id ? stopTimer() : startTimer(todo._id);
                            }}
                            className={`p-1.5 rounded-lg transition-all ${
                              activeTimer === todo._id 
                                ? 'text-red-500 hover:bg-red-50' 
                                : 'text-green-500 hover:bg-green-50'
                            }`}
                            aria-label={activeTimer === todo._id ? 'Stop timer' : 'Start timer'}
                          >
                            {activeTimer === todo._id ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          </button>
                        )}
                        <button 
                          onClick={(e) => deleteTodo(todo._id, e)} 
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          aria-label="Delete task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {currentPage === 'tickets' && (
          <>
            <Header title="Tickets">
              <button onClick={() => handleTicketsExport('pdf')} className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Export PDF"><FileText className="w-4 h-4 sm:w-5 sm:h-5" /></button>
              <button onClick={() => handleTicketsExport('excel')} className="p-1.5 sm:p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Export Excel"><FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5" /></button>
              <button onClick={() => setShowNewTicketForm(true)} className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm">
                <Plus className="w-4 h-4" /> <span className="hidden sm:inline">New Ticket</span><span className="sm:hidden">New</span>
              </button>
            </Header>
            <div className="px-3 sm:px-4 py-3 w-full overflow-x-hidden pt-20">
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-4">
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 text-center border border-gray-100/50">
                  <p className="text-lg font-semibold text-gray-900">{ticketsList.length}</p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 text-center border border-gray-100/50">
                  <p className="text-lg font-semibold text-blue-600">{ticketsList.filter(t => t.status === 'open').length}</p>
                  <p className="text-xs text-gray-500">Open</p>
                </div>
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 text-center border border-gray-100/50">
                  <p className="text-lg font-semibold text-yellow-600">{ticketsList.filter(t => t.status === 'in-progress').length}</p>
                  <p className="text-xs text-gray-500">In Progress</p>
                </div>
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 text-center border border-gray-100/50">
                  <p className="text-lg font-semibold text-green-600">{ticketsList.filter(t => t.status === 'resolved').length}</p>
                  <p className="text-xs text-gray-500">Resolved</p>
                </div>
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 text-center border border-gray-100/50">
                  <p className="text-lg font-semibold text-gray-600">{ticketsList.filter(t => t.status === 'closed').length}</p>
                  <p className="text-xs text-gray-500">Closed</p>
                </div>
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 text-center border border-gray-100/50">
                  <p className="text-lg font-semibold text-red-600">{ticketsList.filter(t => t.priority === 'high').length}</p>
                  <p className="text-xs text-gray-500">High Priority</p>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row flex-wrap gap-2 mb-4">
                <div className="flex-1 min-w-[200px] relative">
                  <label htmlFor="search-tickets" className="sr-only">Search Tickets</label>
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    id="search-tickets"
                    name="ticketSearchQuery"
                    value={ticketSearchQuery} 
                    onChange={(e) => setTicketSearchQuery(e.target.value)} 
                    placeholder="Search by Ticket ID or Subject..."
                    className="w-full pl-9 pr-3 py-2 border rounded-lg bg-white"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label htmlFor="client-filter" className="sr-only">Filter by Client</label>
                  <select 
                    id="client-filter"
                    name="clientFilter"
                    value={ticketClientFilter} 
                    onChange={(e) => setTicketClientFilter(e.target.value)} 
                    className="px-3 py-2 border rounded-lg bg-white"
                  >
                    <option value="all">All Clients</option>
                    {clientsList.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="status-filter" className="sr-only">Filter by Status</label>
                  <select 
                    id="status-filter"
                    name="statusFilter"
                    value={ticketStatusFilter} 
                    onChange={(e) => setTicketStatusFilter(e.target.value)} 
                    className="px-3 py-2 border rounded-lg bg-white"
                  >
                    <option value="all">All Status</option>
                    <option value="open">Open</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              {/* New Ticket Form Modal */}
              {showNewTicketForm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4" onClick={() => setShowNewTicketForm(false)}>
                  <div className="bg-white rounded-2xl p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                    <h2 className="text-xl font-bold mb-4">Create New Ticket</h2>
                    <div className="space-y-3">
                      <div>
                        <label htmlFor="ticket-id-input" className="block text-sm font-medium text-gray-700 mb-1">Ticket ID</label>
                        <input 
                          id="ticket-id-input"
                          name="ticketId"
                          value={newTicket.ticket_id} 
                          onChange={(e) => setNewTicket({...newTicket, ticket_id: e.target.value.toUpperCase()})}
                          placeholder="Ticket ID (e.g., TKT-001)" 
                          className="w-full px-4 py-2 border rounded-lg font-mono"
                          autoComplete="off"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="client-name-input" className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                        <input 
                          id="client-name-input"
                          name="clientName"
                          value={newTicket.client_name} 
                          onChange={(e) => setNewTicket({...newTicket, client_name: e.target.value})}
                          placeholder="Client Name" 
                          className="w-full px-4 py-2 border rounded-lg" 
                          list="clients-list"
                          autoComplete="organization"
                          required
                        />
                        <datalist id="clients-list">
                          {clientsList.map(c => <option key={c} value={c} />)}
                        </datalist>
                      </div>
                      <div>
                        <label htmlFor="ticket-subject-input" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                        <input 
                          id="ticket-subject-input"
                          name="ticketSubject"
                          value={newTicket.subject} 
                          onChange={(e) => setNewTicket({...newTicket, subject: e.target.value})}
                          placeholder="Subject" 
                          className="w-full px-4 py-2 border rounded-lg"
                          autoComplete="off"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="ticket-description-input" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea 
                          id="ticket-description-input"
                          name="ticketDescription"
                          value={newTicket.description} 
                          onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                          placeholder="Description" 
                          rows={3} 
                          className="w-full px-4 py-2 border rounded-lg"
                          autoComplete="off"
                        />
                      </div>
                      <div>
                        <label htmlFor="ticket-priority-select" className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                        <select 
                          id="ticket-priority-select"
                          name="ticketPriority"
                          value={newTicket.priority} 
                          onChange={(e) => setNewTicket({...newTicket, priority: e.target.value})}
                          className="w-full px-4 py-2 border rounded-lg"
                        >
                          <option value="low">Low Priority</option>
                          <option value="medium">Medium Priority</option>
                          <option value="high">High Priority</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => setShowNewTicketForm(false)} className="flex-1 px-4 py-2 border rounded-lg">Cancel</button>
                      <button onClick={createTicket} className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-lg">Create</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Export Modal */}
              {showExportModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4" onClick={() => setShowExportModal(false)}>
                  <div className="bg-white rounded-2xl p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                    <h2 className="text-xl font-bold mb-4">Export {exportType === 'todos' ? 'Tasks' : 'Tickets'}</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                        
                        {/* Quick Presets */}
                        <div className="flex flex-wrap gap-1 mb-3">
                          <button 
                            onClick={() => {
                              const today = new Date();
                              const lastWeek = new Date();
                              lastWeek.setDate(today.getDate() - 7);
                              setExportStartDate(lastWeek.toISOString().split('T')[0]);
                              setExportEndDate(today.toISOString().split('T')[0]);
                            }}
                            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                          >
                            Last 7 days
                          </button>
                          <button 
                            onClick={() => {
                              const today = new Date();
                              const lastMonth = new Date();
                              lastMonth.setDate(today.getDate() - 30);
                              setExportStartDate(lastMonth.toISOString().split('T')[0]);
                              setExportEndDate(today.toISOString().split('T')[0]);
                            }}
                            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                          >
                            Last 30 days
                          </button>
                          <button 
                            onClick={() => {
                              const today = new Date();
                              const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                              setExportStartDate(thisMonth.toISOString().split('T')[0]);
                              setExportEndDate(today.toISOString().split('T')[0]);
                            }}
                            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                          >
                            This month
                          </button>
                          <button 
                            onClick={() => {
                              setExportStartDate('');
                              setExportEndDate('');
                            }}
                            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                          >
                            All time
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label htmlFor="export-start-date" className="block text-xs text-gray-500 mb-1">From Date</label>
                            <input 
                              id="export-start-date"
                              name="exportStartDate"
                              type="date" 
                              value={exportStartDate} 
                              onChange={(e) => setExportStartDate(e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg text-sm"
                              autoComplete="off"
                            />
                          </div>
                          <div>
                            <label htmlFor="export-end-date" className="block text-xs text-gray-500 mb-1">To Date</label>
                            <input 
                              id="export-end-date"
                              name="exportEndDate"
                              type="date" 
                              value={exportEndDate} 
                              onChange={(e) => setExportEndDate(e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg text-sm"
                              autoComplete="off"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Leave empty to export all data</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setExportFormat('pdf')}
                            className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                              exportFormat === 'pdf' 
                                ? 'bg-red-50 border-red-200 text-red-700' 
                                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <FileText className="w-4 h-4 inline mr-2" />
                            PDF
                          </button>
                          <button 
                            onClick={() => setExportFormat('excel')}
                            className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                              exportFormat === 'excel' 
                                ? 'bg-green-50 border-green-200 text-green-700' 
                                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <FileSpreadsheet className="w-4 h-4 inline mr-2" />
                            Excel
                          </button>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-600">
                          <strong>Export Summary:</strong><br />
                          Format: {exportFormat.toUpperCase()}<br />
                          Data: {exportType === 'todos' ? 'Tasks' : 'Tickets'}<br />
                          Range: {exportStartDate || 'All'} to {exportEndDate || 'All'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-6">
                      <button 
                        onClick={() => setShowExportModal(false)} 
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleExportWithDateRange} 
                        className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                      >
                        Export {exportFormat.toUpperCase()}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tickets List */}
              <div className="space-y-2">
                {filteredTickets.length === 0 ? (
                  <div className="bg-white rounded-xl p-8 text-center text-gray-500">No tickets found</div>
                ) : filteredTickets.map(ticket => (
                  <div key={ticket._id} onClick={() => openTicketDetail(ticket)}
                    className={`bg-white rounded-xl p-4 border-l-4 ${getPriorityColor(ticket.priority)} cursor-pointer hover:shadow-md transition group`}>
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">{ticket.ticket_id}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(ticket.status)}`}>{ticket.status}</span>
                        </div>
                        <p className="font-medium truncate">{ticket.subject}</p>
                        <p className="text-sm text-gray-500 truncate">{ticket.client_name} • {formatDate(ticket.created_at)}</p>
                      </div>
                      <button 
                        onClick={(e) => deleteTicket(ticket._id, e)} 
                        className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded"
                        aria-label="Delete ticket"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {currentPage === 'analytics' && (
          <>
            <Header title="Analytics & Performance" />
            <div className="px-3 sm:px-4 py-3 w-full overflow-x-hidden pt-20">
              {/* Performance Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-100/50">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Target className="w-4 h-4 text-blue-600" />
                    </div>
                    <h3 className="font-medium text-gray-900">Completion Rate</h3>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{stats?.completion_rate || 0}%</p>
                  <p className="text-xs text-gray-500">Tasks completed successfully</p>
                </div>
                
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-100/50">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                      <Clock className="w-4 h-4 text-green-600" />
                    </div>
                    <h3 className="font-medium text-gray-900">Total Time</h3>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{Math.floor((stats?.total_time_minutes || 0) / 60)}h {(stats?.total_time_minutes || 0) % 60}m</p>
                  <p className="text-xs text-gray-500">Time spent on tasks</p>
                </div>
                
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-100/50">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-purple-600" />
                    </div>
                    <h3 className="font-medium text-gray-900">Avg Time/Task</h3>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">{Math.round(stats?.avg_time_minutes || 0)}m</p>
                  <p className="text-xs text-gray-500">Average completion time</p>
                </div>
                
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-100/50">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                      <Zap className="w-4 h-4 text-orange-600" />
                    </div>
                    <h3 className="font-medium text-gray-900">Productivity</h3>
                  </div>
                  <p className="text-2xl font-bold text-orange-600">
                    {stats?.completed_todos && stats?.total_todos ? 
                      Math.round((stats.completed_todos / stats.total_todos) * 100) : 0}%
                  </p>
                  <p className="text-xs text-gray-500">Overall efficiency</p>
                </div>
              </div>

              {/* Category & Priority Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-100/50">
                  <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Category Breakdown
                  </h3>
                  <div className="space-y-3">
                    {stats?.category_breakdown?.map(cat => (
                      <div key={cat._id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                          <span className="text-sm capitalize">{cat._id}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-indigo-500 h-2 rounded-full transition-all" 
                              style={{width: `${(cat.completed / cat.total) * 100}%`}}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{cat.completed}/{cat.total}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-100/50">
                  <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Priority Distribution
                  </h3>
                  <div className="space-y-3">
                    {stats?.priority_breakdown?.map(priority => (
                      <div key={priority._id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${
                            priority._id === 'high' ? 'bg-red-500' : 
                            priority._id === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}></div>
                          <span className="text-sm capitalize">{priority._id}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all ${
                                priority._id === 'high' ? 'bg-red-500' : 
                                priority._id === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{width: `${(priority.completed / priority.total) * 100}%`}}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{priority.completed}/{priority.total}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Activity Feed */}
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-100/50">
                <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Recent Activity
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {activities.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No recent activity</p>
                  ) : activities.map(activity => (
                    <div key={activity._id} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        activity.type === 'task_completed' ? 'bg-green-500' :
                        activity.type === 'timer_started' ? 'bg-blue-500' :
                        activity.type === 'timer_stopped' ? 'bg-orange-500' :
                        'bg-gray-500'
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700">{activity.description}</p>
                        <p className="text-xs text-gray-500">{formatTime(activity.created_at)}</p>
                      </div>
                      {activity.time_spent && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {activity.time_spent}m
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {currentPage === 'profile' && (
          <>
            <Header title="Profile & Settings" />
            <div className="px-3 sm:px-4 py-3 w-full overflow-x-hidden pt-20">
              {profileLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                </div>
              ) : profileData ? (
                <ProfileSettings 
                  profileData={profileData} 
                  onUpdateProfile={updateProfile}
                  onChangePassword={changePassword}
                />
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">Failed to load profile data</p>
                  <button onClick={fetchProfile} className="mt-2 px-4 py-2 bg-indigo-500 text-white rounded-lg">
                    Retry
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* AI Daily Planner Modal */}
        {showAIPlanner && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4" onClick={() => setShowAIPlanner(false)}>
            <div className="bg-white rounded-2xl p-4 sm:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  AI Daily Planner
                </h2>
                <button onClick={() => setShowAIPlanner(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Priority Tasks */}
                {aiPlan?.priority_tasks && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="font-semibold text-red-800 mb-2">🎯 Priority Tasks</h3>
                    <ul className="space-y-1">
                      {aiPlan.priority_tasks.map((task, index) => (
                        <li key={index} className="text-red-700 text-sm">• {task}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Daily Schedule */}
                {aiPlan?.daily_schedule && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-800 mb-3">📅 Optimized Schedule</h3>
                    <div className="space-y-2">
                      {aiPlan.daily_schedule.map((slot, index) => (
                        <div key={index} className="flex items-center gap-3 p-2 bg-white rounded border">
                          <span className="font-mono text-sm text-blue-600 w-20">{slot.time_slot}</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{slot.activity}</p>
                            <p className="text-xs text-gray-500">{slot.reasoning}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${
                            slot.energy_required === 'high' ? 'bg-red-100 text-red-700' :
                            slot.energy_required === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {slot.energy_required}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Success Tips */}
                {aiPlan?.success_tips && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-semibold text-green-800 mb-2">💡 Success Tips</h3>
                    <ul className="space-y-1">
                      {aiPlan.success_tips.map((tip, index) => (
                        <li key={index} className="text-green-700 text-sm">• {tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Workflow Optimizer Modal */}
        {showWorkflowOptimizer && workflowOptimization && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4" onClick={() => setShowWorkflowOptimizer(false)}>
            <div className="bg-white rounded-2xl p-4 sm:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                  Workflow Optimization
                </h2>
                <button onClick={() => setShowWorkflowOptimizer(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Productivity Score */}
                {workflowOptimization.productivity_score && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h3 className="font-semibold text-purple-800 mb-2">📊 Productivity Score</h3>
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                        <span className="text-2xl font-bold text-purple-600">{workflowOptimization.productivity_score}</span>
                      </div>
                      <div className="text-purple-700 text-sm">
                        <p>Your current productivity level</p>
                        <p className="text-xs opacity-75">Based on task completion patterns</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Key Insights */}
                {workflowOptimization.key_insights && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-800 mb-2">🔍 Key Insights</h3>
                    <ul className="space-y-1">
                      {workflowOptimization.key_insights.map((insight, index) => (
                        <li key={index} className="text-blue-700 text-sm">• {insight}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Optimization Opportunities */}
                {workflowOptimization.optimization_opportunities && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h3 className="font-semibold text-orange-800 mb-3">⚡ Optimization Opportunities</h3>
                    <div className="space-y-3">
                      {workflowOptimization.optimization_opportunities.map((opp, index) => (
                        <div key={index} className="bg-white rounded border p-3">
                          <h4 className="font-medium text-orange-800">{opp.area}</h4>
                          <p className="text-sm text-orange-700 mt-1">{opp.recommended_change}</p>
                          <p className="text-xs text-orange-600 mt-1">Expected: {opp.expected_impact}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Next Steps */}
                {workflowOptimization.next_steps && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-semibold text-green-800 mb-2">🚀 Next Steps</h3>
                    <ul className="space-y-1">
                      {workflowOptimization.next_steps.map((step, index) => (
                        <li key={index} className="text-green-700 text-sm">• {step}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Smart Suggestions Modal */}
        {showSmartSuggestions && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4" onClick={() => setShowSmartSuggestions(false)}>
            <div className="bg-white rounded-2xl p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  Smart Context Suggestions
                </h2>
                <button onClick={() => setShowSmartSuggestions(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {/* Context Controls */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Context</label>
                    <select 
                      value={currentContext} 
                      onChange={(e) => setCurrentContext(e.target.value)}
                      className="w-full text-xs px-2 py-1 border rounded"
                    >
                      <option value="general">General</option>
                      <option value="morning">Morning</option>
                      <option value="afternoon">Afternoon</option>
                      <option value="evening">Evening</option>
                      <option value="weekend">Weekend</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Mood</label>
                    <select 
                      value={currentMood} 
                      onChange={(e) => setCurrentMood(e.target.value)}
                      className="w-full text-xs px-2 py-1 border rounded"
                    >
                      <option value="neutral">Neutral</option>
                      <option value="energetic">Energetic</option>
                      <option value="tired">Tired</option>
                      <option value="focused">Focused</option>
                      <option value="creative">Creative</option>
                      <option value="stressed">Stressed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Time (min)</label>
                    <input 
                      type="number" 
                      value={availableTime} 
                      onChange={(e) => setAvailableTime(parseInt(e.target.value))}
                      className="w-full text-xs px-2 py-1 border rounded"
                      min="5" max="480"
                    />
                  </div>
                </div>
                <button 
                  onClick={getSmartSuggestions}
                  className="mt-2 px-3 py-1 bg-yellow-500 text-white rounded text-xs hover:bg-yellow-600"
                >
                  Update Suggestions
                </button>
              </div>

              {/* Smart Suggestions */}
              <div className="space-y-3">
                {smartSuggestions.length === 0 ? (
                  <div className="text-center py-8">
                    <Zap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Click "Update Suggestions" to get context-aware recommendations</p>
                  </div>
                ) : smartSuggestions.map((suggestion, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{suggestion.text}</h4>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`text-xs px-2 py-1 rounded ${
                            suggestion.priority === 'high' ? 'bg-red-100 text-red-700' :
                            suggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {suggestion.priority}
                          </span>
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                            {suggestion.category}
                          </span>
                          {suggestion.action_type && (
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                              {suggestion.action_type}
                            </span>
                          )}
                          {suggestion.estimated_time && (
                            <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
                              {suggestion.estimated_time}min
                            </span>
                          )}
                        </div>
                        {suggestion.reasoning && (
                          <p className="text-xs text-gray-500 mt-2">{suggestion.reasoning}</p>
                        )}
                      </div>
                      <button
                        onClick={() => addAISuggestion(suggestion)}
                        className="px-3 py-1.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm flex-shrink-0"
                      >
                        Add Task
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* AI Suggestions Modal */}
        {showAISuggestions && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4" onClick={() => setShowAISuggestions(false)}>
            <div className="bg-white rounded-2xl p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-orange-500" />
                  AI Task Suggestions
                </h2>
                <button onClick={() => setShowAISuggestions(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="mb-4">
                <label htmlFor="ai-context" className="block text-sm font-medium text-gray-700 mb-2">
                  Context (Optional)
                </label>
                <input
                  id="ai-context"
                  name="aiContext"
                  value={aiContext}
                  onChange={(e) => setAiContext(e.target.value)}
                  placeholder="e.g., I'm working on a web project, need to prepare for meeting..."
                  className="w-full px-3 py-2 border rounded-lg"
                  autoComplete="off"
                />
              </div>

              <div className="space-y-3">
                {aiSuggestions.length === 0 ? (
                  <div className="text-center py-8">
                    <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Click "Get Suggestions" to see AI-powered task recommendations</p>
                    <button 
                      onClick={getAISuggestions}
                      disabled={aiLoading}
                      className="mt-3 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
                    >
                      {aiLoading ? 'Getting Suggestions...' : 'Get Suggestions'}
                    </button>
                  </div>
                ) : aiSuggestions.map((suggestion, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{suggestion.text}</h4>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`text-xs px-2 py-1 rounded ${
                            suggestion.priority === 'high' ? 'bg-red-100 text-red-700' :
                            suggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {suggestion.priority}
                          </span>
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                            {suggestion.category}
                          </span>
                          {suggestion.action_type && (
                            <span className={`text-xs px-2 py-1 rounded ${
                              suggestion.action_type === 'focus' ? 'bg-blue-100 text-blue-700' :
                              suggestion.action_type === 'organize' ? 'bg-purple-100 text-purple-700' :
                              suggestion.action_type === 'plan' ? 'bg-indigo-100 text-indigo-700' :
                              suggestion.action_type === 'review' ? 'bg-orange-100 text-orange-700' :
                              'bg-teal-100 text-teal-700'
                            }`}>
                              {suggestion.action_type}
                            </span>
                          )}
                        </div>
                        {suggestion.reasoning && (
                          <p className="text-xs text-gray-500 mt-2">{suggestion.reasoning}</p>
                        )}
                      </div>
                      <button
                        onClick={() => addAISuggestion(suggestion)}
                        className="px-3 py-1.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 text-sm flex-shrink-0"
                      >
                        {suggestion.action_type === 'focus' || suggestion.action_type === 'review' ? 'Take Action' : 'Add Task'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {aiSuggestions.length > 0 && (
                <div className="flex gap-2 mt-4">
                  <button 
                    onClick={getAISuggestions}
                    disabled={aiLoading}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    {aiLoading ? 'Getting More...' : 'Get More Suggestions'}
                  </button>
                  <button 
                    onClick={() => setShowAISuggestions(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  );
};

export default App;
