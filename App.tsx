import React, { useState, useCallback } from 'react';
import { BookOpen, Sparkles, Download, RefreshCw, Printer } from 'lucide-react';
import { Button } from './components/Button';
import { ChatWidget } from './components/ChatWidget';
import { generateSceneDescriptions, generateColoringPageImage } from './services/gemini';
import { generatePDF } from './utils/pdf';
import { AppState, ColoringPage } from './types';

export default function App() {
  const [childName, setChildName] = useState('');
  const [theme, setTheme] = useState('');
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [pages, setPages] = useState<ColoringPage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childName.trim() || !theme.trim()) return;

    setAppState(AppState.GENERATING_PROMPTS);
    setError(null);
    setPages([]);

    try {
      // Step 1: Generate descriptions (Text)
      const descriptions = await generateSceneDescriptions(theme, childName);
      
      // Initialize pages with descriptions
      const initialPages: ColoringPage[] = descriptions.map((desc, idx) => ({
        id: idx.toString(),
        prompt: desc,
        isLoading: true,
      }));
      setPages(initialPages);
      setAppState(AppState.GENERATING_IMAGES);

      // Step 2: Generate images in parallel (or mixed)
      // We update state as each image arrives to show progress
      const imagePromises = initialPages.map(async (page) => {
        try {
          const imageUrl = await generateColoringPageImage(page.prompt);
          setPages(prev => prev.map(p => 
            p.id === page.id ? { ...p, imageUrl, isLoading: false } : p
          ));
        } catch (err) {
          console.error(`Failed to generate image for page ${page.id}`, err);
          setPages(prev => prev.map(p => 
            p.id === page.id ? { ...p, error: 'Failed to generate image', isLoading: false } : p
          ));
        }
      });

      await Promise.all(imagePromises);
      setAppState(AppState.FINISHED);

    } catch (err) {
      console.error(err);
      setError("Something went wrong while starting the magic engine. Please try again!");
      setAppState(AppState.IDLE);
    }
  }, [childName, theme]);

  const handleDownload = () => {
    generatePDF(childName, pages);
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setPages([]);
    setError(null);
    setTheme('');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-primary-200 selection:text-primary-900">
      {/* Decorative Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-secondary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-accent-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 md:py-12 max-w-6xl">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-2xl shadow-md mb-4">
             <BookOpen className="w-8 h-8 text-primary-500 mr-3" />
             <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-900 tracking-tight">
               ColorCraft <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-secondary-500">AI</span>
             </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Create a magical, personalized coloring book for your child in seconds using the power of AI.
          </p>
        </header>

        {/* Main Content */}
        <main className="transition-all duration-500 ease-in-out">
          {appState === AppState.IDLE && (
            <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
              <form onSubmit={handleGenerate} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-bold text-gray-700 mb-2 ml-1">Child's Name</label>
                  <input
                    id="name"
                    type="text"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    placeholder="e.g. Leo"
                    className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-primary-500 focus:ring-0 outline-none transition-all text-lg"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="theme" className="block text-sm font-bold text-gray-700 mb-2 ml-1">Adventure Theme</label>
                  <input
                    id="theme"
                    type="text"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    placeholder="e.g. Space Dinosaurs eating Pizza"
                    className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-primary-500 focus:ring-0 outline-none transition-all text-lg"
                    required
                  />
                </div>
                
                {error && (
                   <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                     {error}
                   </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full py-4 text-lg shadow-xl shadow-primary-500/20"
                  icon={<Sparkles className="w-5 h-5" />}
                >
                  Generate Coloring Book
                </Button>
              </form>
            </div>
          )}

          {(appState !== AppState.IDLE) && (
            <div className="space-y-8">
              {/* Progress / Actions Bar */}
              <div className="flex flex-col md:flex-row items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-100 gap-4">
                <div>
                  <h2 className="text-2xl font-display font-bold text-gray-800">
                    {appState === AppState.FINISHED ? "Your Book is Ready!" : `Creating ${childName}'s Book...`}
                  </h2>
                  <p className="text-gray-500 text-sm">Theme: {theme}</p>
                </div>
                <div className="flex items-center gap-3">
                  {appState === AppState.FINISHED && (
                    <>
                      <Button variant="outline" onClick={handleReset} icon={<RefreshCw className="w-4 h-4"/>}>
                        New
                      </Button>
                      <Button onClick={handleDownload} icon={<Download className="w-4 h-4"/>}>
                        Download PDF
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Grid of Pages */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Cover Preview (Static-ish) */}
                <div className="aspect-[3/4] bg-white rounded-xl shadow-lg border-2 border-primary-100 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden group">
                  <div className="absolute inset-0 border-[12px] border-double border-primary-100 m-4 pointer-events-none"></div>
                  <h3 className="text-4xl font-display font-bold text-primary-600 mb-2 break-words w-full">{childName}'s</h3>
                  <h4 className="text-2xl font-display font-bold text-secondary-500">Coloring Book</h4>
                  <div className="mt-8 text-gray-400 text-sm font-medium">Cover Page</div>
                </div>

                {/* Dynamic Generated Pages */}
                {pages.map((page, idx) => (
                  <div key={page.id} className="aspect-[3/4] bg-white rounded-xl shadow-lg overflow-hidden relative border border-gray-100 group hover:shadow-xl transition-shadow">
                    {page.isLoading ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 text-gray-400 p-6 text-center">
                        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mb-4"></div>
                        <p className="text-sm font-medium animate-pulse">Drawing page {idx + 1}...</p>
                        <p className="text-xs mt-2 opacity-60 px-4">{page.prompt}</p>
                      </div>
                    ) : page.error ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 text-red-400 p-4">
                         <span className="mb-2 text-3xl">😕</span>
                         <p className="text-sm font-bold">Oops!</p>
                         <p className="text-xs text-center">Could not draw this page.</p>
                      </div>
                    ) : (
                      <>
                        <img 
                          src={page.imageUrl} 
                          alt={`Coloring page ${idx + 1}`} 
                          className="w-full h-full object-contain p-4"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 border-t border-gray-100">
                           <p className="text-xs text-gray-600 line-clamp-2">{page.prompt}</p>
                        </div>
                        <div className="absolute top-3 right-3 bg-white/80 rounded-full px-2 py-1 text-xs font-bold text-gray-500 border border-gray-100">
                          Page {idx + 1}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-16 text-center text-gray-400 text-sm pb-8">
          <p>© {new Date().getFullYear()} ColorCraft AI. Powered by Google Gemini.</p>
        </footer>
      </div>

      <ChatWidget />
    </div>
  );
}