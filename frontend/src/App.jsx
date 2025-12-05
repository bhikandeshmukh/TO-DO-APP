import React, { useState, useEffect } from 'react';
import { Check, Plus, Trash2, LogOut, Search, ArrowLeft, Send, MessageCircle, FileText, FileSpreadsheet, Menu, X, ListTodo, Ticket, Home, Clock, User } from 'lucide-react';
import { auth, todos as todosApi, comments as commentsApi, exportData, tickets as ticketsApi, ticketComments as ticketCommentsApi } from './api';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('todos');
  
  // Auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
  const [newTicket, setNewTicket] = useState({ client_name: '', subject: '', description: '', priority: 'medium' });

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
    }
  }, [user]);

  // Close sidebar when clicking outside or changing page
  const closeSidebar = () => setSidebarOpen(false);
  const navigateTo = (page) => { setCurrentPage(page); closeSidebar(); };

  // Auth functions
  const handleAuth = async () => {
    if (!email || !password) return alert('Please enter email and password');
    try {
      const response = isSignUp ? await auth.register(email, password) : await auth.login(email, password);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setUser(response.data.user);
      setEmail(''); setPassword('');
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
    try { const res = await ticketsApi.getAll(); setTicketsList(res.data); } catch (e) { console.error(e); }
  };

  const createTicket = async () => {
    if (!newTicket.client_name || !newTicket.subject) return alert('Client name and subject required');
    try {
      const res = await ticketsApi.create(newTicket);
      setTicketsList([res.data, ...ticketsList]);
      setNewTicket({ client_name: '', subject: '', description: '', priority: 'medium' });
      setShowNewTicketForm(false);
    } catch (e) { alert('Failed to create ticket'); }
  };

  const updateTicketStatus = async (id, status) => {
    try {
      await ticketsApi.update(id, { status });
      setTicketsList(ticketsList.map(t => t._id === id ? { ...t, status } : t));
      if (selectedTicket?._id === id) setSelectedTicket({ ...selectedTicket, status });
    } catch (e) { alert('Failed to update'); }
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
  const handleExport = async (type) => {
    try {
      const res = type === 'pdf' ? await exportData.pdf() : await exportData.excel();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a'); link.href = url;
      link.setAttribute('download', `todos.${type === 'pdf' ? 'pdf' : 'xlsx'}`);
      document.body.appendChild(link); link.click(); link.remove();
    } catch (e) { alert(`Failed to export ${type.toUpperCase()}`); }
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

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
      <div className="animate-pulse p-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl">
        <Check className="w-8 h-8 text-white" />
      </div>
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md border border-gray-100">
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl mb-4">
            <Check className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">To Do App</h1>
          <p className="text-gray-500 mt-2">Manage Your Tasks Efficiently</p>
        </div>
        <div className="space-y-4">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none" placeholder="Email" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none" placeholder="Password" />
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


  // Sidebar Component
  const Sidebar = () => (
    <>
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={closeSidebar} />}
      <div className={`fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-50 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:shadow-none lg:border-r`}>
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl">
              <Check className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">To Do App</span>
          </div>
          <button onClick={closeSidebar} className="lg:hidden p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="p-4 space-y-2">
          <button onClick={() => navigateTo('todos')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${currentPage === 'todos' ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-gray-50'}`}>
            <ListTodo className="w-5 h-5" /> To Do List
          </button>
          <button onClick={() => navigateTo('tickets')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${currentPage === 'tickets' ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-gray-50'}`}>
            <Ticket className="w-5 h-5" /> Tickets
          </button>
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="flex-1 truncate">
              <p className="text-sm font-medium truncate">{user.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>
    </>
  );

  // Header Component
  const Header = ({ title, children }) => (
    <div className="bg-white border-b sticky top-0 z-30 px-4 py-3 flex items-center gap-4">
      <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-gray-100 rounded-xl">
        <Menu className="w-5 h-5" />
      </button>
      <h1 className="text-xl font-bold flex-1">{title}</h1>
      {children}
    </div>
  );

  // Todo Detail View
  if (selectedTodo) return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-10 px-4 py-3 flex items-center gap-4">
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
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <div className={`bg-white rounded-xl p-4 border-l-4 ${getPriorityColor(selectedTodo.priority)}`}>
          <h2 className="font-semibold text-lg">{selectedTodo.text}</h2>
          <p className="text-sm text-gray-500 mt-1">Created {formatDate(selectedTodo.created_at)}</p>
        </div>
        <div className="bg-white rounded-xl p-4">
          <div className="flex gap-2">
            <input value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addComment()}
              placeholder="Add comment..." className="flex-1 px-3 py-2 border rounded-lg" />
            <button onClick={addComment} className="px-4 py-2 bg-indigo-500 text-white rounded-lg"><Send className="w-4 h-4" /></button>
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
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-10 px-4 py-3 flex items-center gap-4">
        <button onClick={() => setSelectedTicket(null)} className="p-2 hover:bg-gray-100 rounded-xl"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex-1">
          <h1 className="font-bold">{selectedTicket.ticket_id}</h1>
          <p className="text-xs text-gray-500">{selectedTicket.client_name}</p>
        </div>
        <select value={selectedTicket.status} onChange={(e) => updateTicketStatus(selectedTicket._id, e.target.value)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${getStatusColor(selectedTicket.status)}`}>
          <option value="open">Open</option>
          <option value="in-progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <div className={`bg-white rounded-xl p-4 border-l-4 ${getPriorityColor(selectedTicket.priority)}`}>
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
            <input value={newTicketComment} onChange={(e) => setNewTicketComment(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addTicketComment()}
              placeholder="Add update..." className="flex-1 px-3 py-2 border rounded-lg" />
            <button onClick={addTicketComment} className="px-4 py-2 bg-indigo-500 text-white rounded-lg"><Send className="w-4 h-4" /></button>
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
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 min-w-0">
        {currentPage === 'todos' && (
          <>
            <Header title="To Do List">
              <button onClick={() => handleExport('pdf')} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Export PDF"><FileText className="w-5 h-5" /></button>
              <button onClick={() => handleExport('excel')} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Export Excel"><FileSpreadsheet className="w-5 h-5" /></button>
            </Header>
            <div className="max-w-4xl mx-auto p-4">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-white rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold">{todos.length}</p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
                <div className="bg-white rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-indigo-600">{todos.filter(t => !t.completed).length}</p>
                  <p className="text-xs text-gray-500">Active</p>
                </div>
                <div className="bg-white rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{todos.filter(t => t.completed).length}</p>
                  <p className="text-xs text-gray-500">Done</p>
                </div>
              </div>

              {/* Add Todo */}
              <div className="bg-white rounded-xl p-4 mb-4">
                <div className="flex gap-2 mb-3">
                  <input value={newTodo} onChange={(e) => setNewTodo(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addTodo()}
                    placeholder="What needs to be done?" className="flex-1 px-4 py-2 border rounded-lg" />
                  <button onClick={addTodo} className="px-4 py-2 bg-indigo-500 text-white rounded-lg"><Plus className="w-5 h-5" /></button>
                </div>
                <div className="flex gap-2">
                  <select value={priority} onChange={(e) => setPriority(e.target.value)} className="px-3 py-1.5 border rounded-lg text-sm">
                    <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                  </select>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-1.5 border rounded-lg text-sm">
                    <option value="personal">Personal</option><option value="work">Work</option><option value="shopping">Shopping</option><option value="health">Health</option>
                  </select>
                </div>
              </div>

              {/* Filters */}
              <div className="flex gap-2 mb-4">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..."
                    className="w-full pl-9 pr-3 py-2 border rounded-lg bg-white" />
                </div>
                <div className="flex bg-white border rounded-lg p-1">
                  {['all', 'active', 'completed'].map(f => (
                    <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded text-sm ${filter === f ? 'bg-indigo-500 text-white' : ''}`}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Todo List */}
              <div className="space-y-2">
                {filteredTodos.length === 0 ? (
                  <div className="bg-white rounded-xl p-8 text-center text-gray-500">No tasks found</div>
                ) : filteredTodos.map(todo => (
                  <div key={todo._id} onClick={() => openTodoDetail(todo)}
                    className={`bg-white rounded-xl p-4 border-l-4 ${getPriorityColor(todo.priority)} cursor-pointer hover:shadow-md transition group`}>
                    <div className="flex items-center gap-3">
                      <button onClick={(e) => toggleTodo(todo._id, todo.completed, e)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center ${todo.completed ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300'}`}>
                        {todo.completed && <Check className="w-3 h-3 text-white" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate ${todo.completed ? 'line-through text-gray-400' : ''}`}>{todo.text}</p>
                        <p className="text-xs text-gray-500">{todo.category} • {formatDate(todo.created_at)}</p>
                      </div>
                      <button onClick={(e) => deleteTodo(todo._id, e)} className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
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
              <button onClick={() => setShowNewTicketForm(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg">
                <Plus className="w-4 h-4" /> New Ticket
              </button>
            </Header>
            <div className="max-w-4xl mx-auto p-4">
              {/* Stats */}
              <div className="grid grid-cols-4 gap-3 mb-6">
                <div className="bg-white rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold">{ticketsList.length}</p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
                <div className="bg-white rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{ticketsList.filter(t => t.status === 'open').length}</p>
                  <p className="text-xs text-gray-500">Open</p>
                </div>
                <div className="bg-white rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-yellow-600">{ticketsList.filter(t => t.status === 'in-progress').length}</p>
                  <p className="text-xs text-gray-500">In Progress</p>
                </div>
                <div className="bg-white rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{ticketsList.filter(t => t.status === 'resolved' || t.status === 'closed').length}</p>
                  <p className="text-xs text-gray-500">Resolved</p>
                </div>
              </div>

              {/* New Ticket Form Modal */}
              {showNewTicketForm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowNewTicketForm(false)}>
                  <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                    <h2 className="text-xl font-bold mb-4">Create New Ticket</h2>
                    <div className="space-y-3">
                      <input value={newTicket.client_name} onChange={(e) => setNewTicket({...newTicket, client_name: e.target.value})}
                        placeholder="Client Name" className="w-full px-4 py-2 border rounded-lg" />
                      <input value={newTicket.subject} onChange={(e) => setNewTicket({...newTicket, subject: e.target.value})}
                        placeholder="Subject" className="w-full px-4 py-2 border rounded-lg" />
                      <textarea value={newTicket.description} onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                        placeholder="Description" rows={3} className="w-full px-4 py-2 border rounded-lg" />
                      <select value={newTicket.priority} onChange={(e) => setNewTicket({...newTicket, priority: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg">
                        <option value="low">Low Priority</option><option value="medium">Medium Priority</option><option value="high">High Priority</option>
                      </select>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => setShowNewTicketForm(false)} className="flex-1 px-4 py-2 border rounded-lg">Cancel</button>
                      <button onClick={createTicket} className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-lg">Create</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tickets List */}
              <div className="space-y-2">
                {ticketsList.length === 0 ? (
                  <div className="bg-white rounded-xl p-8 text-center text-gray-500">No tickets yet</div>
                ) : ticketsList.map(ticket => (
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
                      <button onClick={(e) => deleteTicket(ticket._id, e)} className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default App;
