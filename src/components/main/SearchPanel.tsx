import React, { useState, useEffect } from 'react';
import { Search, Filter, ChevronDown, ChevronUp, FileText, Hash, Database, Upload } from 'lucide-react';
import { useDocuments } from '../../contexts/DocumentContext';
import { documentService } from '../../services/api';

interface SearchResult {
  id: string;
  content: string;
  source: string;
  similarity: number;
  metadata: {
    filename: string;
    title: string;
    author: string;
    chunk_length: number;
  };
}

interface DatabaseDocument {
  id: string;
  name: string;
  filename: string;
  metadata?: {
    filename: string;
    title: string;
    author: string;
    [key: string]: any;
  };
}

const SearchPanel: React.FC = () => {
  const { documents: uploadedDocuments } = useDocuments();
  const [query, setQuery] = useState('');
  const [authorFilter, setAuthorFilter] = useState('');
  const [titleFilter, setTitleFilter] = useState('');
  const [resultLimit, setResultLimit] = useState(10);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());
  const [searchError, setSearchError] = useState<string>('');
  const [databaseDocuments, setDatabaseDocuments] = useState<DatabaseDocument[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);

  // Load documents from database on component mount
  useEffect(() => {
    loadDatabaseDocuments();
  }, []);

  const loadDatabaseDocuments = async () => {
    setIsLoadingDocuments(true);
    try {
      const docs = await documentService.getDocuments();
      setDatabaseDocuments(docs || []);
    } catch (error) {
      console.error('Failed to load documents from database:', error);
      setDatabaseDocuments([]);
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  // Combine uploaded documents with database documents
  const allDocuments = [
    ...uploadedDocuments.map(doc => ({
      id: doc.id.toString(),
      name: doc.name,
      filename: doc.name,
      metadata: doc.metadata
    })), 
    ...databaseDocuments
  ];

  // Filter and rank results for better quality
  const filterAndRankResults = (results: SearchResult[]) => {
    if (!results || results.length === 0) return [];
    
    // Filter out very low relevance results (below 10%)
    const relevantResults = results.filter(result => result.similarity >= 0.1);
    
    // Remove duplicates based on content similarity
    const uniqueResults = relevantResults.reduce((acc: SearchResult[], current) => {
      const isDuplicate = acc.some(existing => 
        existing.content.substring(0, 150) === current.content.substring(0, 150) &&
        Math.abs(existing.similarity - current.similarity) < 0.05
      );
      if (!isDuplicate) {
        acc.push(current);
      }
      return acc;
    }, []);
    
    // Sort by relevance (highest first)
    return uniqueResults.sort((a, b) => b.similarity - a.similarity);
  };

  const handleSearch = async () => {
    if (!query.trim()) {
      setSearchError('Please enter a search query');
      return;
    }

    // Check if we have any documents available
    if (allDocuments.length === 0) {
      setSearchError('No documents available in the database. Please upload documents first.');
      return;
    }

    setIsSearching(true);
    setSearchError('');
    setResults([]);

    try {
        console.log('Starting semantic search for:', query);

        const searchResponse = await documentService.search(query, {
          filter_author: authorFilter || undefined,
          filter_title: titleFilter || undefined,
          n_results: Math.min(resultLimit * 2, 50) // Get more for filtering
        });

        const backendResults = searchResponse.results;
        
        console.log('Semantic search response:', searchResponse);
        
        if (backendResults && backendResults.documents && backendResults.documents.length > 0) {
          const transformedResults: SearchResult[] = [];
          
          backendResults.documents.forEach((docGroup: string[], groupIndex: number) => {
            docGroup.forEach((content: string, docIndex: number) => {
              const metadata = backendResults.metadatas?.[groupIndex]?.[docIndex] || {};
              const distance = backendResults.distances?.[groupIndex]?.[docIndex] || 0;
              
              transformedResults.push({
                id: `${metadata.file_hash || 'unknown'}-${groupIndex}-${docIndex}`,
                content: content,
                source: metadata.filename || 'Unknown document',
                similarity: Math.max(0, 1 - (distance || 0)),
                metadata: {
                  filename: metadata.filename || 'Unknown',
                  title: metadata.title || 'Untitled',
                  author: metadata.author || 'Unknown',
                  chunk_length: metadata.chunk_length || 0
                }
              });
            });
          });

          const processedResults = filterAndRankResults(transformedResults).slice(0, resultLimit);
          setResults(processedResults);
          
          if (processedResults.length === 0) {
            setSearchError('No relevant matches found. Try a different search query.');
          }
        } else {
          console.log('No documents found in backend response');
          setResults([]);
          setSearchError('No relevant matches found. Try using more descriptive phrases or different terminology.');
        }
      } catch (error: any) {
      console.error('Search failed:', error);
      setSearchError(error.message || 'Search failed. Please check your connection and try again.');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleResultExpansion = (id: string) => {
    const newExpanded = new Set(expandedResults);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedResults(newExpanded);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };


  const uniqueAuthors = Array.from(new Set(allDocuments.map(doc => 
    doc.metadata?.author || 'Unknown'
  ))).filter(author => author !== 'Unknown');

  const uniqueTitles = Array.from(new Set(allDocuments.map(doc => 
    doc.metadata?.title || doc.name
  ))).filter(title => title !== 'Untitled' && title !== 'Unknown');

    
    // Calculate relevance badge color
    const getRelevanceColor = (similarity: number) => {
      if (similarity > 0.7) return 'bg-green-100 text-green-800 border-green-200';
      if (similarity > 0.4) return 'bg-blue-100 text-blue-800 border-blue-200';
      if (similarity > 0.2) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      return 'bg-gray-100 text-gray-800 border-gray-200';
    };

    // Truncate content to show more meaningful snippets
    const truncateContent = (content: string, maxLength: number = 300) => {
      if (!content) return 'No content available';
      if (content.length <= maxLength) return content;
      const truncated = content.substring(0, maxLength);
      const lastSentenceEnd = Math.max(
        truncated.lastIndexOf('. '),
        truncated.lastIndexOf('?\n'),
        truncated.lastIndexOf('!\n')
      );
      
      const lastParagraphBreak = truncated.lastIndexOf('\n\n');
  
      // Then try word boundary
      const lastWordBoundary = truncated.lastIndexOf(' ');
      
      if (lastSentenceEnd > maxLength * 0.6) {
        return truncated.substring(0, lastSentenceEnd + 1) + '..';
      } else if (lastParagraphBreak > maxLength * 0.6) {
        return truncated.substring(0, lastParagraphBreak) + '...';
      } else if (lastWordBoundary > maxLength * 0.6) {
        return truncated.substring(0, lastWordBoundary) + '...';
      }
      
      return truncated + '...';
    };

    const cleanContent = (content: string) => {
      if (!content) return 'No content available';
      
      return content
        .replace(/\s+/g, ' ') 
        .replace(/\n+/g, '\n') 
        .replace(/([.!?])\s+/g, '$1\n') 
        .trim();
    };

    return (
    <div className="flex flex-col h-full bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30">
      <div className="p-6 border-b border-gray-200 bg-white">
        <div className="space-y-4">
          {/* Search Header */}
          <div className="flex items-center space-x-2 mb-2">
            <Search className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Semantic Search</h2>
          </div>

          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search using natural language (e.g., 'What is Python used for?')"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-300 shadow-sm"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={!query.trim() || isSearching || allDocuments.length === 0}
              className="group px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg shadow-blue-500/25"
            >
              <span className="flex items-center space-x-2">
                {isSearching ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
                    <span>Search</span>
                  </>
                )}
              </span>
            </button>
          </div>

          {/* Filters Section */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center space-x-2 mb-3">
              <Filter className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Filters</span>
            </div>
            
            <div className="flex items-center space-x-4 text-sm flex-wrap gap-3">
              <div className="flex items-center space-x-2">
                <label className="text-gray-600 text-sm">Author:</label>
                <select
                  value={authorFilter}
                  onChange={(e) => setAuthorFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 bg-white min-w-[140px]"
                >
                  <option value="">All Authors</option>
                  {uniqueAuthors.map(author => (
                    <option key={author} value={author}>{author}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-gray-600 text-sm">Title:</label>
                <select
                  value={titleFilter}
                  onChange={(e) => setTitleFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 bg-white min-w-[140px]"
                >
                  <option value="">All Titles</option>
                  {uniqueTitles.map(title => (
                    <option key={title} value={title}>{title}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-gray-600 text-sm">Results:</label>
                <select
                  value={resultLimit}
                  onChange={(e) => setResultLimit(Number(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 bg-white"
                >
                  <option value={5}>5 results</option>
                  <option value={10}>10 results</option>
                  <option value={20}>20 results</option>
                  <option value={50}>50 results</option>
                </select>
              </div>
            </div>
          </div>

          {searchError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 flex items-center">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                {searchError}
              </p>
            </div>
          )}

          {/* Documents Status */}
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-700">
                  {allDocuments.length} document{allDocuments.length !== 1 ? 's' : ''} available for search
                  {uploadedDocuments.length > 0 && databaseDocuments.length > 0 && (
                    <span className="text-blue-500 ml-1">
                      ({uploadedDocuments.length} new, {databaseDocuments.length} from database)
                    </span>
                  )}
                </span>
              </div>
              <button
                onClick={loadDatabaseDocuments}
                disabled={isLoadingDocuments}
                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors disabled:opacity-50"
              >
                {isLoadingDocuments ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {results.length === 0 && !isSearching ? (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {allDocuments.length === 0 ? 'No Documents Available' : 'Semantic Search'}
            </h3>
            <p className="text-gray-600 max-w-md mx-auto mb-4">
              {allDocuments.length === 0 
                ? 'Upload some documents to begin searching through your content.'
                : 'Search through your documents using natural language understanding. Ask questions in plain English.'
              }
            </p>
            {allDocuments.length === 0 ? (
              <div className="flex items-center justify-center space-x-2 text-amber-600">
                <Upload className="w-4 h-4" />
                <span className="text-sm">Upload documents in the Upload Panel to get started</span>
              </div>
            ) : (
              <div className="text-sm text-gray-500 space-y-1">
                <p>💡 <strong>Search tips:</strong></p>
                <p>• Use complete questions or descriptive phrases</p>
                <p>• Try rephrasing if you don't get good results</p>
                <p>• Be specific about what you're looking for</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {results.length > 0 && (
              <div className="text-sm text-gray-600 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <span className="font-medium">
                  Found {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
                </span>
              </div>
            )}

              {results.map((result, index) => {
                const resultId = result.id;
                const similarityPercent = Math.round(result.similarity * 100);
                
                return (
                  <div key={resultId} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="p-4">
                      {/* Header Section */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                              Semantic Match
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRelevanceColor(result.similarity)}`}>
                              {similarityPercent}% relevant
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {result.metadata?.title || 'Untitled Document'}
                          </h3>
                        </div>
                        <button
                          onClick={() => toggleResultExpansion(resultId)}
                          className="ml-4 p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                        >
                          {expandedResults.has(resultId) ? 
                            <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                      
                      {/* Metadata Section */}
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-4 flex-wrap">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-700">{result.metadata?.filename || 'Unknown file'}</span>
                        </div>
                        {result.metadata?.author && result.metadata.author !== 'Unknown' && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">By {result.metadata.author}</span>
                          </div>
                        )}
                      </div>

                      {/* Content Preview */}
                      <div className={`text-gray-700 leading-relaxed ${expandedResults.has(resultId) ? '' : 'line-clamp-4'}`}>
                        {cleanContent(truncateContent(result.content))}
                      </div>

                      {/* Expanded Content */}
                      {expandedResults.has(resultId) && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="text-gray-700 whitespace-pre-wrap leading-relaxed font-mono text-sm bg-gray-50 p-3 rounded-lg">
                            {cleanContent(result.content)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
            })}
          </div>
        )}

        {isSearching && results.length === 0 && (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg mb-2">Searching through your documents...</p>
            <p className="text-sm text-gray-500">
              Analyzing {allDocuments.length} document{allDocuments.length !== 1 ? 's' : ''} for matches
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPanel;