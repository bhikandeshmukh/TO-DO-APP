import React, { useState, useEffect } from 'react';
import { Check, Plus, Trash2, LogOut, Search, ArrowLeft, Send, MessageCircle, FileText, FileSpreadsheet, Download } from 'lucide-react';
import { auth, todos as todosApi, comments as commentsApi, exportData } from './api';

const StreamlineTodoApp = () => {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [priority, setPriority] = useState('medium');
  const [category, setCategory] = useState('personal');
  const [loading, setLoading] = useState(true);
  
  // Detail page state
  const [selectedTodo, setSelectedTodo] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      fetchTodos();
    } else {
      setTodos([]);
    }
  }, [user]);

  const fetchTodos = async () => {
    try {
      const response = await todosApi.getAll();
      setTodos(response.data);
    } catch (error) {
      console.error('Error fetching todos:', error);
    }
  };

  const handleAuth = async () => {
    if (!email || !password) {
      alert('Please enter email and password');
      return;
    }
    try {
      let response;
      if (isSignUp) {
        response = await auth.register(email, password);
      } else {
        response = await auth.login(email, password);
      }
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setUser(response.data.user);
      setEmail('');
      setPassword('');
    } catch (error) {
      alert(error.response?.data?.message || 'Authentication failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setTodos([]);
    setSelectedTodo(null);
  };

  const addTodo = async () => {
    if (!newTodo.trim()) return;
    try {
      const response = await todosApi.create({ text: newTodo, priority, category });
      setTodos([response.data, ...todos]);
      setNewTodo('');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to add todo');
    }
  };

  const toggleTodo = async (id, completed, e) => {
    e?.stopPropagation();
    try {
      await todosApi.update(id, { completed: !completed });
      setTodos(todos.map(todo => 
        todo._id === id ? { ...todo, completed: !completed } : todo
      ));
      if (selectedTodo?._id === id) {
        setSelectedTodo({ ...selectedTodo, completed: !completed });
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update todo');
    }
  };

  const deleteTodo = async (id, e) => {
    e?.stopPropagation();
    try {
      await todosApi.delete(id);
      setTodos(todos.filter(todo => todo._id !== id));
      if (selectedTodo?._id === id) {
        setSelectedTodo(null);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete todo');
    }
  };

  // Open todo detail page
  const openTodoDetail = async (todo) => {
    setSelectedTodo(todo);
    setLoadingComments(true);
    try {
      const response = await commentsApi.getAll(todo._id);
      setComments(response.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
    setLoadingComments(false);
  };

  // Add comment
  const addComment = async () => {
    if (!newComment.trim() || !selectedTodo) return;
    try {
      const response = await commentsApi.create(selectedTodo._id, newComment);
      setComments([response.data, ...comments]);
      setNewComment('');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to add comment');
    }
  };

  // Delete comment
  const deleteComment = async (commentId) => {
    try {
      await commentsApi.delete(selectedTodo._id, commentId);
      setComments(comments.filter(c => c._id !== commentId));
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete comment');
    }
  };

  // Export functions
  const handleExportPDF = async () => {
    try {
      const response = await exportData.pdf();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'todos.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Failed to export PDF');
    }
  };

  const handleExportExcel = async () => {
    try {
      const response = await exportData.excel();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'todos.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Failed to export Excel');
    }
  };

  const filteredTodos = todos
    .filter(todo => {
      if (filter === 'active') return !todo.completed;
      if (filter === 'completed') return todo.completed;
      return true;
    })
    .filter(todo => todo.text.toLowerCase().includes(searchQuery.toLowerCase()));

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-green-500';
      default: return 'border-l-gray-500';
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  // Group comments by date
  const groupCommentsByDate = (comments) => {
    const groups = {};
    comments.forEach(comment => {
      const dateKey = formatDate(comment.created_at);
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(comment);
    });
    return groups;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block p-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl mb-4 animate-pulse">
            <Check className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition" placeholder="••••••••" />
            </div>
            <button onClick={handleAuth} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl font-medium hover:from-indigo-600 hover:to-purple-700 transition shadow-lg hover:shadow-xl">
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
          <div className="mt-6 text-center">
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Todo Detail Page
  if (selectedTodo) {
    const groupedComments = groupCommentsByDate(comments);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
            <button onClick={() => setSelectedTodo(null)} className="p-2 hover:bg-gray-100 rounded-xl transition">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900 truncate">{selectedTodo.text}</h1>
              <p className="text-xs text-gray-500">{selectedTodo.category} • {selectedTodo.priority} priority</p>
            </div>
            <button onClick={(e) => toggleTodo(selectedTodo._id, selectedTodo.completed, e)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${selectedTodo.completed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
              {selectedTodo.completed ? '✓ Completed' : 'Mark Complete'}
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-4 py-8">
          {/* Task Info Card */}
          <div className={`bg-white rounded-2xl p-6 shadow-sm border-l-4 ${getPriorityColor(selectedTodo.priority)} border border-gray-100 mb-6`}>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{selectedTodo.text}</h2>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="px-3 py-1 bg-gray-100 rounded-lg">{selectedTodo.category}</span>
              <span>Created {formatDate(selectedTodo.created_at)} at {formatTime(selectedTodo.created_at)}</span>
            </div>
          </div>

          {/* Add Comment */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
            <div className="flex gap-3">
              <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addComment()}
                placeholder="Add a comment..." className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition" />
              <button onClick={addComment} className="px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition">
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Timeline Comments */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5" /> Activity Timeline
            </h3>
            
            {loadingComments ? (
              <p className="text-gray-500 text-center py-8">Loading comments...</p>
            ) : comments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No comments yet. Add the first one!</p>
            ) : (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[7px] top-0 bottom-0 w-0.5 bg-gray-200"></div>
                
                {Object.entries(groupedComments).map(([date, dateComments]) => (
                  <div key={date} className="mb-6">
                    <p className="text-sm font-medium text-gray-500 mb-3 ml-6">{date}</p>
                    {dateComments.map((comment) => (
                      <div key={comment._id} className="relative flex gap-4 mb-4 group">
                        {/* Timeline dot */}
                        <div className="w-4 h-4 rounded-full bg-indigo-500 border-2 border-white shadow-sm flex-shrink-0 mt-1 z-10"></div>
                        
                        <div className="flex-1 bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-gray-900">{comment.text}</p>
                              <p className="text-xs text-gray-500 mt-1">{comment.user_email} • {formatTime(comment.created_at)}</p>
                            </div>
                            <button onClick={() => deleteComment(comment._id)} 
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded-lg transition text-red-500">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }


  // Main Todo List Page
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl">
              <Check className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">To Do App</h1>
              <p className="text-xs text-gray-500">Welcome back, {user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExportPDF} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-red-50 transition text-red-600 border border-red-200" title="Export PDF">
              <FileText className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">PDF</span>
            </button>
            <button onClick={handleExportExcel} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-green-50 transition text-green-600 border border-green-200" title="Export Excel">
              <FileSpreadsheet className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">Excel</span>
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-100 transition text-gray-700">
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 py-8">
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm">Total</p>
            <p className="text-2xl font-bold text-gray-900">{todos.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm">Active</p>
            <p className="text-2xl font-bold text-indigo-600">{todos.filter(t => !t.completed).length}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm">Done</p>
            <p className="text-2xl font-bold text-green-600">{todos.filter(t => t.completed).length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-6">
          <div className="flex gap-3 mb-4">
            <input type="text" value={newTodo} onChange={(e) => setNewTodo(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addTodo()}
              placeholder="What needs to be done?" className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition" />
            <button onClick={addTodo} className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition shadow-md hover:shadow-lg">
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="flex gap-3">
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="px-4 py-2 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm">
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-4 py-2 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm">
              <option value="personal">Personal</option>
              <option value="work">Work</option>
              <option value="shopping">Shopping</option>
              <option value="health">Health</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search tasks..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none bg-white" />
          </div>
          <div className="flex gap-2 bg-white rounded-xl border border-gray-200 p-1">
            <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === 'all' ? 'bg-indigo-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>All</button>
            <button onClick={() => setFilter('active')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === 'active' ? 'bg-indigo-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Active</button>
            <button onClick={() => setFilter('completed')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === 'completed' ? 'bg-indigo-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Done</button>
          </div>
        </div>

        <div className="space-y-3">
          {filteredTodos.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <div className="inline-block p-4 bg-gray-100 rounded-full mb-4">
                <Check className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">No tasks found</p>
            </div>
          ) : (
            filteredTodos.map(todo => (
              <div key={todo._id} onClick={() => openTodoDetail(todo)}
                className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 ${getPriorityColor(todo.priority)} border border-gray-100 hover:shadow-md transition group cursor-pointer`}>
                <div className="flex items-center gap-4">
                  <button onClick={(e) => toggleTodo(todo._id, todo.completed, e)}
                    className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition ${todo.completed ? 'bg-gradient-to-r from-indigo-500 to-purple-600 border-indigo-500' : 'border-gray-300 hover:border-indigo-500'}`}>
                    {todo.completed && <Check className="w-4 h-4 text-white" />}
                  </button>
                  <div className="flex-1">
                    <p className={`font-medium ${todo.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>{todo.text}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs px-2 py-1 rounded-lg bg-gray-100 text-gray-600">{todo.category}</span>
                      <span className="text-xs text-gray-400">{new Date(todo.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button onClick={(e) => deleteTodo(todo._id, e)} className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 rounded-lg transition text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default StreamlineTodoApp;
