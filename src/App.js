import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'https://auto-hunter-back-end.vercel.app';

function App() {
  const [url, setUrl] = useState('');
  const [saveDirectory, setSaveDirectory] = useState('');
  const [fileType, setFileType] = useState('zip'); // zip, images, pdf
  const [files, setFiles] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [urlError, setUrlError] = useState(false);
  const [directoryError, setDirectoryError] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [qrCodeImage, setQrCodeImage] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [qrCodeLoading, setQrCodeLoading] = useState(false);
  
  // Estados para seleção de arquivos
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [allSelected, setAllSelected] = useState(true);
  
  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Estados para download progress
  const [downloadProgress, setDownloadProgress] = useState({});
  const [currentDownload, setCurrentDownload] = useState(null);
  const [downloadStats, setDownloadStats] = useState({
    totalFiles: 0,
    completedFiles: 0,
    currentFile: '',
    speed: 0,
    eta: '',
    progress: 0
  });
  
  // Estado para modal de download
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  
  // Estado para controle de cancelamento
  const [abortController, setAbortController] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  
  // Estado para modal de contribuição
  const [showContributionModal, setShowContributionModal] = useState(false);
  

  const clearMessages = () => {
    if (result) {
      setResult(null);
    }
    if (error) {
      setError('');
    }
    setUrlError(false);
    setDirectoryError(false);
  };

  const handleContribution = () => {
    console.log('Opening contribution modal');
    setShowContributionModal(true);
    fetchQRCode();
  };

  const fetchQRCode = async () => {
    console.log('Iniciando busca do QR Code...');
    setQrCodeLoading(true);
    
    // Teste simples com uma imagem estática primeiro
    setTimeout(() => {
      const testImageUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=test';
      console.log('Testando com URL:', testImageUrl);
      setQrCodeImage(testImageUrl);
      setQrCodeLoading(false);
    }, 1000);
  };

  // eslint-disable-next-line no-unused-vars
  const generateFallbackQRCode = () => {
    // Gerar um QR Code usando uma API pública
    const qrText = 'https://nubank.com.br/cobrar/9z19/68f29932-3b48-4af5-b9b3-12671d60182a';
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrText)}`;
    setQrCodeImage(qrApiUrl);
  };


  const handleScan = async () => {
    if (!url) {
      setError('Informe a URL');
      setUrlError(true);
      return;
    }

    // Validar URL antes de enviar
    try {
      const urlObj = new URL(url);
      
      // Verificar se é um IP interno (apenas aviso, não bloqueia)
      if (urlObj.hostname.match(/^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/)) {
        console.warn('URL contém IP interno:', urlObj.hostname);
        // Não bloqueia mais - apenas aviso
      }
      
      // Verificar se tem credenciais (apenas aviso)
      if (urlObj.username || urlObj.password) {
        console.warn('URL contém credenciais:', urlObj.username ? 'usuário presente' : '', urlObj.password ? 'senha presente' : '');
      }
      
      // Verificar se a URL está muito longa ou tem caracteres problemáticos
      if (url.length > 2048) {
        setError('URL muito longa. Tente uma URL mais curta.');
        setUrlError(true);
        return;
      }
      
      // Verificar caracteres especiais problemáticos
      if (url.includes(' ') || url.includes('\n') || url.includes('\r') || url.includes('\t')) {
        setError('URL contém caracteres inválidos (espaços, quebras de linha).');
        setUrlError(true);
        return;
      }
      
      // Verificar se a URL não contém caracteres de controle
      if (/[\x00-\x1F\x7F]/.test(url)) {
        setError('URL contém caracteres de controle inválidos.');
        setUrlError(true);
        return;
      }
      
      // Verificar se a URL não está malformada (múltiplos protocolos, etc.)
      if (url.match(/^https?:\/\/https?:\/\//) || url.match(/^http:\/\/http:\/\//)) {
        setError('URL malformada: múltiplos protocolos detectados.');
        setUrlError(true);
        return;
      }
      
    } catch (e) {
      setError('URL inválida. Verifique o formato da URL.');
      setUrlError(true);
      return;
    }

    setScanning(true);
    setError('');
    setResult(null);
    setFiles([]);
    setResult(null);
    setSelectedFiles([]);
    setAllSelected(true);

    try {
      console.log('Enviando requisição para:', `${API_URL}/scan`);
      console.log('Dados originais:', { url, save_directory: saveDirectory || 'C:/downloads', file_type: fileType });
      console.log('URL original:', JSON.stringify(url));
      console.log('URL após trim:', JSON.stringify(url.trim()));
      
      const requestData = {
        url: url.trim(),
        save_directory: (saveDirectory || 'C:/downloads').trim(),
        file_type: fileType
      };
      
      // Validar dados antes de enviar
      if (!requestData.url || !requestData.file_type) {
        throw new Error('Dados obrigatórios não fornecidos');
      }
      
      // Validar formato da URL após trim
      if (requestData.url.length === 0) {
        throw new Error('URL não pode estar vazia');
      }
      
      // Validar se o tipo de arquivo é válido
      const validFileTypes = ['zip', 'images', 'pdf'];
      if (!validFileTypes.includes(requestData.file_type)) {
        throw new Error(`Tipo de arquivo inválido: ${requestData.file_type}`);
      }
      
      // Validar se o diretório não está vazio
      if (!requestData.save_directory || requestData.save_directory.trim().length === 0) {
        requestData.save_directory = 'C:/downloads'; // Valor padrão
      }
      
      console.log('Dados validados:', requestData);
      
      const response = await axios.post(`${API_URL}/scan`, requestData, {
        timeout: 60000, // 60 segundos de timeout
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log('Resposta recebida:', response.data);

      setFiles(response.data.files || []);
      setCurrentPage(1); // Reset to first page
      
      // Selecionar todos os arquivos por padrão
      if (response.data.files && response.data.files.length > 0) {
        const allFileUrls = response.data.files.map(file => file.url);
        setSelectedFiles(allFileUrls);
        setAllSelected(true);
      }
    } catch (error) {
      console.error('Erro ao escanear:', error);
      
      // Mostrar erro mais específico
      if (error.response) {
        // Erro de resposta do servidor
        const errorMessage = error.response.data?.detail || error.response.data?.message || error.response.statusText;
        const statusCode = error.response.status;
        
        console.log('Detalhes do erro:', error.response.data);
        
        // Verificar se é erro de URL inválida
        if (errorMessage && (errorMessage.includes('Invalid URL') || errorMessage.includes('No scheme supplied'))) {
          setUrlError(true);
          setError('URL inválida. Verifique o formato da URL.');
        } else if (errorMessage && (errorMessage.includes('Connection refused') || errorMessage.includes('timeout'))) {
          setError('Não foi possível conectar ao servidor. Verifique a URL e tente novamente.');
        } else if (errorMessage && (errorMessage.includes('Authentication failed') || errorMessage.includes('Unauthorized'))) {
          setError('Falha na autenticação. Verifique as credenciais na URL.');
        } else if (statusCode === 400) {
          // Verificar se é erro de URL interna
          if (errorMessage && errorMessage.includes('URL interna detectada')) {
            setError(`❌ ${errorMessage}. O backend não consegue acessar esta rede interna.`);
          } else if (errorMessage && errorMessage.includes('malformados') || errorMessage && errorMessage.includes('malformados')) {
            setError(`❌ Erro 400 - Dados malformados: ${errorMessage}. Verifique se a URL está correta e não contém caracteres especiais.`);
          } else if (errorMessage && errorMessage.includes('Invalid URL') || errorMessage && errorMessage.includes('URL inválida')) {
            setError(`❌ URL inválida: ${errorMessage}. Verifique o formato da URL.`);
          } else {
            setError(`❌ Erro 400 - Requisição inválida: ${errorMessage || 'Dados malformados'}. Verifique a URL e os parâmetros enviados.`);
          }
        } else if (statusCode === 422) {
          setError(`Erro 422 - Dados inválidos: ${errorMessage || 'Parâmetros incorretos'}`);
        } else {
          setError(`Erro do servidor: ${statusCode} - ${errorMessage || 'Erro desconhecido'}`);
        }
      } else if (error.request) {
        // Erro de rede/conexão
        setError('Erro de conexão. Verifique sua internet e tente novamente.');
      } else {
        // Outros erros
        setError(`Erro: ${error.message}`);
      }
    } finally {
      setScanning(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedFiles([]);
      setAllSelected(false);
    } else {
      const allFileUrls = files.map(file => file.url);
      setSelectedFiles(allFileUrls);
      setAllSelected(true);
    }
  };

  const handleFileSelect = (fileUrl) => {
    if (selectedFiles.includes(fileUrl)) {
      setSelectedFiles(selectedFiles.filter(url => url !== fileUrl));
      setAllSelected(false);
    } else {
      setSelectedFiles([...selectedFiles, fileUrl]);
      // Verificar se todos estão selecionados
      if (selectedFiles.length + 1 === files.length) {
        setAllSelected(true);
      }
    }
  };

  const getSelectedFiles = () => {
    return selectedFiles;
  };

  // Funções para paginação
  const getCurrentPageFiles = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return files.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    return Math.ceil(files.length / itemsPerPage);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const getPageNumbers = () => {
    const totalPages = getTotalPages();
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  const handleCancelDownload = () => {
    // Mostrar diálogo de confirmação
    setShowCancelDialog(true);
  };

  const confirmCancelDownload = () => {
    if (abortController) {
      abortController.abort();
    }
    
    setShowCancelDialog(false);
    setShowDownloadModal(false);
    setDownloading(false);
    
    // Limpar todos os campos
    setUrl('');
    setSaveDirectory('');
    setFiles([]);
    setSelectedFiles([]);
    setAllSelected(true);
    
    // Resetar estados de download
    setDownloadProgress({});
    setCurrentDownload(null);
    setDownloadStats({
      totalFiles: 0,
      completedFiles: 0,
      currentFile: '',
      speed: 0,
      eta: '',
      progress: 0
    });
    
    // Mostrar mensagem
    setResult(null);
    setError('Download cancelado pelo usuário');
  };

  const cancelCancelDownload = () => {
    // Continuar download, apenas fechar diálogo
    setShowCancelDialog(false);
  };

  const handleDownload = async () => {
    if (!url || url.trim() === '') {
      setError('Informe a URL');
      setUrlError(true);
      return;
    }

    if (!saveDirectory || saveDirectory.trim() === '') {
      setError('Informe o diretório');
      setDirectoryError(true);
      return;
    }

    if (selectedFiles.length === 0) {
      setError('Por favor, selecione pelo menos um arquivo para download');
      return;
    }

    setDownloading(true);
    setError('');
    setResult(null);
    setDownloadProgress({});
    setCurrentDownload(null);
    setDownloadStats({
      totalFiles: 0,
      completedFiles: 0,
      currentFile: '',
      speed: 0,
      eta: '',
      progress: 0
    });
    setShowDownloadModal(true);

    // Criar AbortController para cancelamento
    const controller = new AbortController();
    setAbortController(controller);

    try {
      const selectedFilesUrls = getSelectedFiles();
      
      if (selectedFilesUrls.length === 0) {
        setError('Nenhum arquivo selecionado para download');
        setDownloading(false);
        setShowDownloadModal(false);
        return;
      }
      
      console.log('Enviando requisição de download para:', `${API_URL}/download-stream`);
      console.log('Dados:', { url, save_directory: saveDirectory, selected_files: selectedFilesUrls, file_type: fileType });
      
      const response = await axios.post(`${API_URL}/download-stream`, {
          url: url,
          save_directory: saveDirectory,
          selected_files: selectedFilesUrls,
          file_type: fileType
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 300000, // 5 minutos de timeout para downloads
        signal: controller.signal
      });

      console.log('Resposta do download recebida:', response.data);

      // Processar resposta do download
      if (response.data.success) {
        // Download iniciado com sucesso
        setResult(response.data.message || 'Download iniciado com sucesso!');
        
        // Simular progresso de download
                  setDownloadStats(prev => ({
                    ...prev,
          totalFiles: selectedFilesUrls.length,
          progress: 100,
          currentFile: 'Download concluído!'
        }));
        
        // Marcar todos os arquivos como concluídos
        const completedFiles = {};
        selectedFilesUrls.forEach(fileUrl => {
          const filename = fileUrl.split('/').pop() || 'arquivo';
          completedFiles[filename] = {
                      progress: 100,
            downloaded: 0,
            total: 0,
                      status: 'completed'
          };
        });
        setDownloadProgress(completedFiles);
        
        // Fechar modal após 3 segundos
        setTimeout(() => {
                  setDownloading(false);
                  setShowDownloadModal(false);
        }, 3000);
        
      } else {
        throw new Error(response.data.error || 'Erro no download');
      }

    } catch (err) {
      console.error('Erro ao fazer download:', err);
      
      if (err.name === 'AbortError') {
        return;
      }
      
      // Mostrar erro mais específico
      if (err.response) {
        const errorMessage = err.response.data?.error || err.response.data?.message || err.response.statusText;
        setError(`Erro no download: ${errorMessage}`);
      } else if (err.request) {
        setError('Erro de conexão. Verifique sua internet e tente novamente.');
      } else {
        setError(`Erro: ${err.message}`);
      }
      
      setDownloading(false);
      setShowDownloadModal(false);
    } finally {
      setAbortController(null);
    }
  };

    return (
      <div className="App">
      <div className="container">
        <div className="header">
          <div className="logo-container">
            <div className="logo-icon">
              <img src="/logo-icon.png" alt="Nexora Logo" />
            </div>
            <div className="logo-text">
              <div className="company-name">Nexora</div>
              <div className="product-name">AutoHunter</div>
            </div>
          </div>
          <p>Baixe arquivos ZIP, imagens e PDFs</p>
        </div>

        {/* Seção de Contribuição */}
        <div className="contribution-section">
          <div className="contribution-card">
            <div className="contribution-icon">💝</div>
            <div className="contribution-content">
              <h3>Gostou da aplicação?</h3>
              <p>Se o Nexora AutoHunter te ajudou, considere fazer uma contribuição para apoiar o desenvolvimento!</p>
              <button 
                className="contribution-btn"
                onClick={handleContribution}
                title="Abrir link do PIX"
              >
                <span className="btn-icon">💰</span>
                Contribuir com PIX
              </button>
            </div>
          </div>
        </div>

        <div className="form-container">
          <div className="input-group">
            <label htmlFor="url">URL para escanear:</label>
            <div className="input-container">
              <input
                id="url"
                type="text"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  clearMessages();
                }}
                onFocus={clearMessages}
                className={`input-field ${urlError ? 'input-error' : ''}`}
              />
              {urlError && (
                <div className="tooltip">
                  <div className="tooltip-arrow"></div>
                  <div className="tooltip-content">
                    {!url || url.trim() === '' ? 'Informe a URL' : 'Url inválida'}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="directory">Diretório de destino:</label>
            <div className="input-container">
              <input
                id="directory"
                type="text"
                placeholder="Ex: C:\downloads"
                value={saveDirectory}
                onChange={(e) => {
                  setSaveDirectory(e.target.value);
                  clearMessages();
                }}
                onFocus={clearMessages}
                className={`input-field ${directoryError ? 'input-error' : ''}`}
              />
              {directoryError && (
                <div className="tooltip">
                  <div className="tooltip-arrow"></div>
                  <div className="tooltip-content">
                    Informe o diretório
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="fileType">Tipo de arquivo:</label>
            <select
              id="fileType"
              value={fileType}
              onChange={(e) => {
                setFileType(e.target.value);
                clearMessages();
              }}
              className="input-field"
            >
              <option value="zip">Arquivos Comprimidos (.zip, .7z, .rar)</option>
              <option value="images">Imagens (.png, .jpeg, .jpg, .gif, .bmp)</option>
              <option value="pdf">Documentos PDF (.pdf)</option>
            </select>
          </div>


          <div className="button-group">
            <button
              onClick={handleScan}
              disabled={scanning || downloading}
              className="btn btn-secondary"
            >
              {scanning ? '🔍 Escaneando...' : '🔍 Escanear'}
            </button>

            <button 
              onClick={handleDownload}
              disabled={scanning || downloading || selectedFiles.length === 0}
              className="btn btn-primary"
            >
              {downloading ? '⬇️ Baixando...' : 
               selectedFiles.length > 0 ? `⬇️ Baixar Arquivos (${selectedFiles.length})` : '⬇️ Baixar Arquivo'}
            </button>
          </div>
        </div>

        {error && !urlError && !directoryError && (
          <div className="alert alert-error">
            <strong>❌ Erro:</strong> {error}
          </div>
        )}

        {result && (
          <div className="results-container">
            <div className="alert alert-success">
              <strong>✅ Download concluído!</strong>
              <p>
                {result.downloaded} arquivo(s) baixado(s) com sucesso
                {result.failed > 0 && `, ${result.failed} falhou(aram)`}
              </p>
            </div>
          </div>
        )}

        {files.length > 0 && !scanning && !downloading && !result && (
          <div className="results-container">
            <div className="files-header">
        <h2>
          {fileType === 'zip' && '📦 Arquivos Comprimidos encontrados'}
          {fileType === 'images' && '🖼️ Imagens encontradas'}
          {fileType === 'pdf' && '📄 Documentos PDF encontrados'}
          ({files.length})
        </h2>
              <div className="select-controls">
                <label className="select-all-label">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    className="select-all-checkbox"
                  />
                  <span className="select-all-text">
                    {allSelected ? 'Desmarcar Todos' : 'Marcar Todos'}
                  </span>
                </label>
              </div>
            </div>

            {/* Grid de arquivos com paginação */}
            <div className="files-grid">
              {getCurrentPageFiles().map((file, localIndex) => {
                const globalIndex = (currentPage - 1) * itemsPerPage + localIndex;
                const isSelected = selectedFiles.includes(file.url);
                return (
                  <div key={globalIndex} className="file-card">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleFileSelect(file.url)}
                      className="file-checkbox"
                    />
                    <div className="file-content">
                <div className="file-icon">
                  {fileType === 'zip' && '📦'}
                  {fileType === 'images' && '🖼️'}
                  {fileType === 'pdf' && '📄'}
                </div>
                      <div className="file-details">
                        <div className="file-name" title={file.filename}>
                          {file.filename}
                        </div>
                        <div className="file-url" title={file.url}>
                          {file.url}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Paginação */}
            {getTotalPages() > 1 && (
              <div className="pagination">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  ← Anterior
                </button>
                
                <div className="pagination-numbers">
                  {getPageNumbers().map((page, index) => (
                    <button
                      key={index}
                      onClick={() => typeof page === 'number' && handlePageChange(page)}
                      disabled={page === '...'}
                      className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === getTotalPages()}
                  className="pagination-btn"
                >
                  Próximo →
                </button>
              </div>
            )}

            <div className="download-info">
              <p>📋 {selectedFiles.length} de {files.length} arquivos selecionados</p>
              <p>📄 Página {currentPage} de {getTotalPages()}</p>
            </div>
          </div>
        )}

        {/* Crédito do Desenvolvedor */}
        <div className="developer-credit-main">
          <p>Desenvolvido por: <strong>Welton Faria</strong></p>
        </div>

      </div>

      {/* Modal de Download */}
      {showDownloadModal && (
        <div className="modal-overlay" onClick={handleCancelDownload}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <div className="spinner"></div>
                <h2>💾 Baixando Arquivos...</h2>
              </div>
              <button 
                onClick={handleCancelDownload}
                className="modal-close-button"
                title="Cancelar download"
              >
                ✕
            </button>
          </div>
          
          {/* Estatísticas Gerais */}
          <div className="download-stats">
            <div className="stat-item">
              <span className="stat-label">Arquivos:</span>
              <span className="stat-value">
                {downloadStats.completedFiles || 0}/{downloadStats.totalFiles || 0}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Velocidade:</span>
              <span className="stat-value">
                {formatBytes(downloadStats.speed || 0)}/s
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Tempo Restante:</span>
              <span className={`stat-value ${downloadStats.eta === 'AGUARDE...' ? 'waiting' : ''}`}>
                {downloadStats.eta || 'Calculando...'}
              </span>
            </div>
          </div>

          {/* Arquivo Atual */}
          <div className="current-file">
            <div className="file-header">
              <span className="file-icon">📄</span>
              <span className="file-name">{currentDownload?.filename || 'Preparando download...'}</span>
              <span className="file-progress">{currentDownload?.progress?.toFixed(1) || 0}%</span>
            </div>
            
            <div className="progress-bar-container">
              <div 
                className="progress-bar" 
                style={{ width: `${currentDownload?.progress || 0}%` }}
              ></div>
            </div>
            
            <div className="file-stats">
              <span>{formatBytes(currentDownload?.downloaded_bytes || 0)} / {formatBytes(currentDownload?.total_bytes || 0)}</span>
              <span>{formatBytes(currentDownload?.speed || 0)}/s</span>
              <span className={currentDownload?.eta === 'AGUARDE...' ? 'eta-waiting' : ''}>
                ETA: {currentDownload?.eta || 'Calculando...'}
              </span>
            </div>
          </div>

          {/* Lista de Todos os Arquivos */}
          <div className="files-progress-list">
            <h4>📦 Progresso dos Arquivos</h4>
            {Object.keys(downloadProgress).length > 0 ? (
              Object.entries(downloadProgress)
                 .sort(([filenameA, progressA], [filenameB, progressB]) => {
                   // Arquivo atual (baixando) sempre no topo
                   const currentFile = currentDownload?.filename;
                   
                   if (filenameA === currentFile && progressA.status === 'downloading') return -1;
                   if (filenameB === currentFile && progressB.status === 'downloading') return 1;
                   
                   // Ordem: baixando > erro > concluído
                   if (progressA.status === 'downloading' && progressB.status !== 'downloading') return -1;
                   if (progressB.status === 'downloading' && progressA.status !== 'downloading') return 1;
                   
                   if (progressA.status === 'error' && progressB.status === 'completed') return -1;
                   if (progressB.status === 'error' && progressA.status === 'completed') return 1;
                   
                   // Se mesmo status, ordenar por nome (mais recente primeiro)
                   return filenameB.localeCompare(filenameA);
                 })
                .map(([filename, progress]) => (
                <div key={filename} className={`file-progress-item ${progress.status}`}>
                  <div className="file-info">
                    <span className="file-icon">
                      {progress.status === 'completed' ? '✅' : 
                       progress.status === 'error' ? '❌' : '📄'}
                      </span>
                    <span className="file-name">{filename}</span>
                    {filename === currentDownload?.filename && progress.status === 'downloading' && (
                      <span className="current-badge">🔄 Baixando</span>
                    )}
                  </div>
                  <div className="progress-bar-container small">
                    <div 
                      className="progress-bar" 
                      style={{ width: `${progress.progress}%` }}
                    ></div>
                  </div>
                  <div className="progress-info">
                    <span>{progress.progress?.toFixed(1)}%</span>
                    <span>{formatBytes(progress.downloaded)} / {formatBytes(progress.total)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-files-message">
                <span>📋 Aguardando arquivos para download...</span>
              </div>
            )}
          </div>
        </div>
          </div>
        )}

      {/* Modal de Contribuição */}
      {showContributionModal && (
        <div className="modal-overlay" onClick={() => {
          setShowContributionModal(false);
          setQrCodeImage(null);
        }}>
          <div className="modal-content contribution-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <h2>💝 Contribuir com o Nexora AutoHunter</h2>
              </div>
              <button 
                className="modal-close-button"
                onClick={() => {
                  setShowContributionModal(false);
                  setQrCodeImage(null);
                }}
                title="Fechar"
              >
                ✕
              </button>
            </div>

            <div className="contribution-modal-content">
              <div className="pix-details">
                <div className="pix-section">
                  <h4>📱 QR Code para doação</h4>
                   <div className="qr-code-section">
                    <div className="qr-code-container">
                      <img 
                        src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=00020126330014BR.GOV.BCB.PIX0111058244476405204000053039865802BR5923Welton%20Eugenio%20de%20Faria6009SAO%20PAULO62140510BoibXepOts630493D4" 
                        alt="QR Code PIX" 
                        className="qr-code-image"
                        onError={(e) => {
                          console.log('Erro ao carregar QR Code PIX');
                          // Fallback para um QR Code PIX de exemplo
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmZiIvPjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiMwMDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPk5lY2Vzc2FyaW8gUXIgQ29kZSBQSVg8L3RleHQ+PC9zdmc+';
                        }}
                      />
                      <div className="qr-buttons">
                        <button 
                          className="copy-qr-btn"
                          onClick={() => {
                            // Copiar chave PIX real
                            navigator.clipboard.writeText('00020126330014BR.GOV.BCB.PIX0111058244476405204000053039865802BR5923Welton Eugenio de Faria6009SAO PAULO62140510BoibXepOts630493D4');
                            alert('Chave PIX copiada!');
                          }}
                        >
                          📋 Copiar Chave PIX
                        </button>
                        <button 
                          className="close-qr-btn"
                          onClick={() => {
                            setShowContributionModal(false);
                            setQrCodeImage(null);
                          }}
                        >
                          ✕ Fechar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Diálogo de Confirmação de Cancelamento */}
      {showCancelDialog && (
        <div className="dialog-overlay">
          <div className="dialog-content">
            <h3>⚠️ Cancelar Download?</h3>
            <p>Deseja realmente cancelar o download em andamento?</p>
            <p className="dialog-warning">Todos os arquivos baixados até o momento serão perdidos.</p>
            <div className="dialog-buttons">
              <button onClick={cancelCancelDownload} className="btn btn-secondary">
                Não, Continuar
              </button>
              <button onClick={confirmCancelDownload} className="btn btn-danger">
                Sim, Cancelar
              </button>
            </div>
          </div>
              </div>
            )}
    </div>
  );
}

export default App;

