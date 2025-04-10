import React, { useState } from 'react';
import './TutorialVideo.css';

interface Video {
  id: string;
  title: string;
  description: string;
  duration: string;
  thumbnailUrl: string;
  videoUrl: string;
  category: string;
}

const TutorialVideo: React.FC = () => {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  
  // Lista de vídeos tutoriais
  const videos: Video[] = [
    {
      id: '1',
      title: 'Introdução ao Método Sábio de Investir',
      description: 'Neste vídeo, apresentamos os fundamentos do Método Sábio de Investir e como ele pode ajudar você a construir uma carteira de dividendos consistente.',
      duration: '12:45',
      thumbnailUrl: 'https://via.placeholder.com/300x169?text=Tutorial+MSI',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      category: 'fundamentos'
    },
    {
      id: '2',
      title: 'Como analisar o Dividend Yield de uma ação',
      description: 'Aprenda a avaliar corretamente o Dividend Yield de uma empresa e identificar armadilhas de rendimento.',
      duration: '15:20',
      thumbnailUrl: 'https://via.placeholder.com/300x169?text=Dividend+Yield',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      category: 'analise'
    },
    {
      id: '3',
      title: 'Calculando o preço-teto de ações',
      description: 'Um guia passo a passo para determinar o preço-teto de uma ação usando o modelo de fluxo de caixa descontado simplificado.',
      duration: '18:36',
      thumbnailUrl: 'https://via.placeholder.com/300x169?text=Preço+Teto',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      category: 'analise'
    },
    {
      id: '4',
      title: 'Como utilizar o Blueprint Sábio efetivamente',
      description: 'Um tour completo pelo Blueprint Sábio, mostrando como aproveitar ao máximo todas as funcionalidades da plataforma.',
      duration: '10:12',
      thumbnailUrl: 'https://via.placeholder.com/300x169?text=Tutorial+Blueprint',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      category: 'plataforma'
    },
    {
      id: '5',
      title: 'Estratégias de reinvestimento de dividendos',
      description: 'Descubra as melhores estratégias para reinvestir seus dividendos e potencializar o crescimento do seu patrimônio.',
      duration: '14:50',
      thumbnailUrl: 'https://via.placeholder.com/300x169?text=Reinvestimento',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      category: 'estrategias'
    },
    {
      id: '6',
      title: 'Montando uma carteira diversificada com foco em dividendos',
      description: 'Aprenda como construir uma carteira de investimentos diversificada que gere dividendos consistentes e crescentes ao longo do tempo.',
      duration: '22:15',
      thumbnailUrl: 'https://via.placeholder.com/300x169?text=Carteira+Diversificada',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      category: 'estrategias'
    },
    {
      id: '7',
      title: 'Analisando o histórico de pagamento de dividendos',
      description: 'Como avaliar o histórico de pagamentos de dividendos de uma empresa e identificar padrões importantes para sua decisão de investimento.',
      duration: '16:40',
      thumbnailUrl: 'https://via.placeholder.com/300x169?text=Histórico+Dividendos',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      category: 'analise'
    },
    {
      id: '8',
      title: 'Checklist de investimento: aplicação prática',
      description: 'Veja como aplicar o checklist do Método Sábio de Investir em casos reais de análise de empresas listadas na B3.',
      duration: '19:30',
      thumbnailUrl: 'https://via.placeholder.com/300x169?text=Checklist+Prático',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      category: 'fundamentos'
    }
  ];
  
  // Categorias de vídeos
  const categories = [
    { id: 'all', name: 'Todos os Vídeos' },
    { id: 'fundamentos', name: 'Fundamentos' },
    { id: 'analise', name: 'Análise de Ações' },
    { id: 'estrategias', name: 'Estratégias' },
    { id: 'plataforma', name: 'Uso da Plataforma' }
  ];
  
  // Filtragem de vídeos por categoria
  const filteredVideos = activeCategory === 'all' 
    ? videos 
    : videos.filter(video => video.category === activeCategory);
  
  // Manipulador para selecionar um vídeo
  const handleVideoSelect = (video: Video) => {
    setSelectedVideo(video);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Manipulador para alterar a categoria
  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    setSelectedVideo(null);
  };

  return (
    <div className="tutorials-container">
      <div className="tutorials-header">
        <h2>Tutoriais do Método Sábio de Investir</h2>
        <p>Aprenda a investir em dividendos com nossa biblioteca de tutoriais em vídeo</p>
      </div>
      
      {selectedVideo ? (
        <div className="video-player-section">
          <div className="video-player">
            <iframe 
              src={selectedVideo.videoUrl}
              title={selectedVideo.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
          
          <div className="video-info">
            <h3>{selectedVideo.title}</h3>
            <span className="video-duration">{selectedVideo.duration}</span>
            <p className="video-description">{selectedVideo.description}</p>
            
            <button 
              className="back-to-videos-btn"
              onClick={() => setSelectedVideo(null)}
            >
              ← Voltar para lista de vídeos
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="categories-filter">
            {categories.map(category => (
              <button 
                key={category.id}
                className={`category-btn ${activeCategory === category.id ? 'active' : ''}`}
                onClick={() => handleCategoryChange(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>
          
          <div className="videos-grid">
            {filteredVideos.map(video => (
              <div 
                key={video.id} 
                className="video-card"
                onClick={() => handleVideoSelect(video)}
              >
                <div className="video-thumbnail">
                  <img src={video.thumbnailUrl} alt={video.title} />
                  <span className="video-duration">{video.duration}</span>
                </div>
                <div className="video-details">
                  <h3>{video.title}</h3>
                  <p>{video.description.substring(0, 80)}...</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      
      <div className="tutorials-footer">
        <p>Novos tutoriais são adicionados mensalmente. Fique atento às atualizações!</p>
      </div>
    </div>
  );
};

export default TutorialVideo;