import React, { useState, useEffect, useMemo } from 'react';
import { Note } from '../types';
import { api } from '../api';
import { Send, Trash2, Maximize2, Tag, Plus, Edit3, Pin, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { PluggableList } from 'unified';

interface IndependentNotesViewProps {
  onOpenNoteEditor: (initialValue: string, onSave: (content: string) => void, title: string) => void;
}

export function IndependentNotesView({ onOpenNoteEditor }: IndependentNotesViewProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [editingLabelValue, setEditingLabelValue] = useState('');
  
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteLabel, setNewNoteLabel] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const data = await api.fetchNotes('note');
      setNotes(data);
      if (data.length > 0 && !selectedNoteId && !isCreating) {
        setSelectedNoteId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    notes.forEach(note => {
      if (note.label) {
        note.label.split(/[,，]/).forEach(tag => {
          const trimmed = tag.trim();
          if (trimmed) tags.add(trimmed);
        });
      }
    });
    return Array.from(tags).sort();
  }, [notes]);

  const filteredNotes = useMemo(() => {
    if (selectedTags.length === 0) return notes;
    return notes.filter(note => {
      if (!note.label) return false;
      const noteTags = note.label.split(/[,，]/).map(t => t.trim());
      return selectedTags.some(tag => noteTags.includes(tag));
    });
  }, [notes, selectedTags]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return;
    try {
      const newNote = await api.createNote(0, newNoteContent, 'note', newNoteLabel);
      setNotes([newNote, ...notes]);
      setNewNoteContent('');
      setNewNoteLabel('');
      setIsCreating(false);
      setSelectedNoteId(newNote.id);
    } catch (error) {
      console.error('Failed to add note:', error);
    }
  };

  const handleDeleteNote = async (id: number) => {
    if (!confirm('确定要删除这条笔记吗？')) return;
    try {
      await api.deleteNote(id);
      const remainingNotes = notes.filter(n => n.id !== id);
      setNotes(remainingNotes);
      if (selectedNoteId === id) {
        if (remainingNotes.length > 0) {
          setSelectedNoteId(remainingNotes[0].id);
        } else {
          setSelectedNoteId(null);
          setIsCreating(true);
        }
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const handleUpdateNote = async (id: number, content: string) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    try {
      const updatedNote = await api.updateNote(id, content, note.label, note.sort);
      setNotes(notes.map(n => n.id === id ? updatedNote : n));
    } catch (error) {
      console.error('Failed to update note:', error);
    }
  };

  const handleUpdateLabel = async (id: number) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    try {
      const updatedNote = await api.updateNote(id, note.content, editingLabelValue, note.sort);
      setNotes(notes.map(n => n.id === id ? updatedNote : n));
      setIsEditingLabel(false);
    } catch (error) {
      console.error('Failed to update label:', error);
    }
  };

  const handleTogglePin = async (id: number, currentSort: number = 0) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    const newSort = currentSort > 0 ? 0 : 100; // Toggle between 0 and 100
    try {
      const updatedNote = await api.updateNote(id, note.content, note.label, newSort);
      // Re-sort notes locally: Pinned (sort desc) -> CreatedAt desc
      const updatedNotes = notes.map(n => n.id === id ? updatedNote : n);
      updatedNotes.sort((a, b) => {
        const sortA = a.sort || 0;
        const sortB = b.sort || 0;
        if (sortA !== sortB) return sortB - sortA;
        return b.createdAt - a.createdAt;
      });
      setNotes(updatedNotes);
    } catch (error) {
      console.error('Failed to toggle pin:', error);
    }
  };
  
  const handlePaste = async (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const items = event.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.includes('image')) {
          event.preventDefault();
          const file = items[i].getAsFile();
          if (!file) return;
          
          try {
            const url = await api.uploadImage(file);
            const imageMarkdown = `![image](${url})`;
            setNewNoteContent((prev) => prev + imageMarkdown);
          } catch (error) {
            console.error('Failed to upload image:', error);
          }
          break;
        }
      }
  };

  const getNoteTitle = (content: string) => {
    const firstLine = content.split('\n')[0].trim();
    return firstLine.slice(0, 15) + (firstLine.length > 15 ? '...' : '') || '无标题笔记';
  };

  if (isLoading) {
      return <div className="p-8 text-center text-gray-500">加载中...</div>;
  }

  const selectedNote = notes.find(n => n.id === selectedNoteId);

  return (
    <div className="h-full flex gap-6">
      {/* Left Sidebar */}
      <div className="w-80 flex flex-col h-full shrink-0">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4 shrink-0 space-y-3">
          <button
            onClick={() => {
              setIsCreating(true);
              setSelectedNoteId(null);
              setNewNoteContent('');
              setNewNoteLabel('');
            }}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isCreating 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
            }`}
          >
            <Plus size={18} />
            新增笔记
          </button>

          {/* Tag Filter */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-2 py-1 text-xs rounded-full transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {filteredNotes.map(note => (
            <div
              key={note.id}
              onClick={() => {
                setSelectedNoteId(note.id);
                setIsCreating(false);
                setIsEditingLabel(false);
              }}
              className={`p-4 rounded-xl border cursor-pointer transition-all bg-white shadow-sm relative group ${
                selectedNoteId === note.id 
                  ? 'border-blue-500 ring-1 ring-blue-500' 
                  : 'border-gray-100 hover:border-blue-300 hover:shadow-md'
              }`}
            >
              {(note.sort || 0) > 0 && (
                <Pin size={14} className="absolute top-2 right-2 text-blue-500 fill-blue-500" />
              )}
              <h3 className={`font-medium text-sm mb-2 pr-4 ${selectedNoteId === note.id ? 'text-blue-700' : 'text-gray-700'}`}>
                {getNoteTitle(note.content)}
              </h3>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{format(new Date(note.createdAt), 'MM-dd HH:mm', { locale: zhCN })}</span>
                {note.label && (
                  <div className="flex gap-1 max-w-[120px] overflow-hidden">
                    {note.label.split(/[,，]/).slice(0, 2).map((tag, i) => (
                      <span key={i} className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 scale-90 origin-right whitespace-nowrap">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {filteredNotes.length === 0 && !isCreating && (
            <div className="p-8 text-center text-gray-400 text-sm bg-white rounded-xl border border-gray-100 border-dashed">
              {selectedTags.length > 0 ? '没有匹配的笔记' : '暂无笔记，点击上方按钮创建'}
            </div>
          )}
        </div>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white rounded-xl shadow-md border border-gray-100">
        {isCreating ? (
          <div className="flex-1 flex flex-col p-8 max-w-3xl mx-auto w-full">
            <h2 className="text-xl font-bold text-gray-800 mb-6">新建笔记</h2>
            
            <div className="flex-1 flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                  <Tag size={18} className="text-gray-400" />
                  <input 
                      type="text" 
                      value={newNoteLabel}
                      onChange={(e) => setNewNoteLabel(e.target.value)}
                      placeholder="标签 (用逗号分隔)"
                      className="bg-transparent border-none focus:ring-0 text-sm w-full outline-none"
                  />
              </div>
              
              <div className="flex-1 relative">
                <textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      handleAddNote();
                    }
                  }}
                  onPaste={handlePaste}
                  placeholder="在此输入笔记内容 (支持 Markdown)..."
                  className="w-full h-full p-4 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none transition-all font-mono text-sm leading-relaxed"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => onOpenNoteEditor(newNoteContent, (content) => setNewNoteContent(content), '新建笔记')}
                  className="absolute top-2 right-2 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="全屏编辑"
                >
                  <Maximize2 size={18} />
                </button>
              </div>

              <div className="flex justify-end pt-2">
                <button
                    onClick={handleAddNote}
                    disabled={!newNoteContent.trim()}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                    <Send size={18} />
                    保存笔记
                </button>
              </div>
            </div>
          </div>
        ) : selectedNote ? (
          <div className="flex-1 flex flex-col h-full">
            {/* Note Header */}
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-start bg-white">
              <div className="flex-1 mr-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm text-gray-400">
                    创建于 {format(new Date(selectedNote.createdAt), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
                  </span>
                  
                  {isEditingLabel ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editingLabelValue}
                        onChange={(e) => setEditingLabelValue(e.target.value)}
                        className="text-xs border border-blue-300 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="输入标签..."
                        autoFocus
                      />
                      <button onClick={() => handleUpdateLabel(selectedNote.id)} className="text-green-600 hover:text-green-700"><Save size={14} /></button>
                      <button onClick={() => setIsEditingLabel(false)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group/label">
                      {selectedNote.label && (
                        <div className="flex gap-2">
                          {selectedNote.label.split(/[,，]/).map((tag, i) => (
                            <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full border border-blue-100">
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                      <button 
                        onClick={() => {
                          setEditingLabelValue(selectedNote.label || '');
                          setIsEditingLabel(true);
                        }}
                        className="opacity-0 group-hover/label:opacity-100 p-1 text-gray-400 hover:text-blue-600 transition-opacity"
                        title="编辑标签"
                      >
                        <Edit3 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTogglePin(selectedNote.id, selectedNote.sort)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors text-sm ${
                    (selectedNote.sort || 0) > 0 
                      ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' 
                      : 'text-gray-500 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                  title={(selectedNote.sort || 0) > 0 ? "取消置顶" : "置顶笔记"}
                >
                  <Pin size={16} className={(selectedNote.sort || 0) > 0 ? "fill-current" : ""} />
                  {(selectedNote.sort || 0) > 0 ? "已置顶" : "置顶"}
                </button>
                <button
                  onClick={() => onOpenNoteEditor(selectedNote.content, (content) => handleUpdateNote(selectedNote.id, content), '编辑笔记')}
                  className="flex items-center gap-1 px-3 py-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm"
                >
                  <Edit3 size={16} />
                  编辑
                </button>
                <button
                  onClick={() => handleDeleteNote(selectedNote.id)}
                  className="flex items-center gap-1 px-3 py-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
                >
                  <Trash2 size={16} />
                  删除
                </button>
              </div>
            </div>

            {/* Note Content */}
            <div className="flex-1 overflow-y-auto p-8">
              <div className="prose prose-blue max-w-none text-gray-700">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm] as PluggableList}
                  components={{
                    code(props) {
                      const {children, className, node, ref, ...rest} = props
                      const match = /language-(\w+)/.exec(className || '')
                      return match ? (
                        <SyntaxHighlighter
                          {...rest}
                          PreTag="div"
                          children={String(children).replace(/\n$/, '')}
                          language={match[1]}
                          style={vscDarkPlus}
                        />
                      ) : (
                        <code {...rest} className={className}>
                          {children}
                        </code>
                      )
                    }
                  }}
                >
                  {selectedNote.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 flex-col gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Edit3 size={32} className="text-gray-300" />
            </div>
            <p>选择左侧笔记查看详情，或点击“新增笔记”</p>
          </div>
        )}
      </div>
    </div>
  );
}
