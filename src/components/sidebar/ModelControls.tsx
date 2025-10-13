import React, { useState, useEffect } from 'react';
import { Brain, Zap } from 'lucide-react';
import { useDocuments } from '../../contexts/DocumentContext';
import { documentService } from '../../services/api';

const ModelControls: React.FC = () => {
  const { addActivity } = useDocuments();
  const [embeddingModel, setEmbeddingModel] = useState('sentence-transformers/all-MiniLM-L6-v2');
  const [inferenceModel, setInferenceModel] = useState('google/gemma-2b');
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const models = await documentService.getEmbeddingModels();
        setAvailableModels(models.models);
      } catch (error) {
        console.error('Failed to load models:', error);
      }
    };
    loadModels();
  }, []);

  const embeddingModels = [
    { 
      id: 'BAAI/bge-m3', 
      name: 'BGE-M3', 
      provider: 'BAAI'
    },
    { 
      id: 'sentence-transformers/all-MiniLM-L6-v2', 
      name: 'all-MiniLM-L6-v2', 
      provider: 'Sentence Transformers'
    },
  ];

  const inferenceModels = [
  { 
    id: 'gemini', 
    name: 'Gemini Flash', 
    provider: 'Google',
    description: 'Fast and accurate (requires API key)'
  },
  { 
    id: 'microsoft/DialoGPT-medium', 
    name: 'DialoGPT-Medium', 
    provider: 'Microsoft',
    description: 'Good for conversations, runs locally'
  },
  { 
    id: 'microsoft/DialoGPT-large', 
    name: 'DialoGPT-Large', 
    provider: 'Microsoft', 
    description: 'Better quality, requires more RAM'
  },
  { 
    id: 'google/flan-t5-base', 
    name: 'FLAN-T5-Base', 
    provider: 'Google',
    description: 'Fast instruction following'
  }
];

const handleEmbeddingModelChange = async (modelId: string) => {
  const model = embeddingModels.find(m => m.id === modelId);
  
  if (window.confirm(`Are you sure you want to change the embedding model to ${model?.name}? This will recreate the vector database.`)) {
    try {
      await documentService.setEmbeddingModel(modelId);
      setEmbeddingModel(modelId);
      
      addActivity({
        id: Date.now(),
        type: 'model_change',
        message: `Embedding model changed to ${model?.name}`,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to change model:', error);
      alert('Failed to change model. Please try again.');
    }
  }
};

  const handleInferenceModelChange = (modelId: string) => {
    setInferenceModel(modelId);
    const model = inferenceModels.find(m => m.id === modelId);
    addActivity({
      id: Date.now(),
      type: 'model_change',
      message: `Inference model changed to ${model?.name}`,
      timestamp: new Date()
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">Model Settings</h3>
      
      <div className="space-y-3">
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
            <Brain className="w-4 h-4" />
            <span>Embedding Model</span>
          </label>
          <select
            value={embeddingModel}
            onChange={(e) => handleEmbeddingModelChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:border-purple-300 hover:shadow-md"
          >
            {embeddingModels.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name} ({model.provider})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
            <Zap className="w-4 h-4" />
            <span>Inference Model</span>
          </label>
          <select
            value={inferenceModel}
            onChange={(e) => handleInferenceModelChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 hover:border-purple-300 hover:shadow-md"
          >
            {inferenceModels.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name} ({model.provider})
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default ModelControls;