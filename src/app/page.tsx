import { createProject, getProjects } from './actions';
import { ProjectList } from './project-list';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const projects = await getProjects();

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-purple-400 to-pink-600 text-transparent bg-clip-text">
          Faceless Video Generator
        </h1>

        {/* Create Form */}
        <div className="bg-gray-800 p-6 rounded-xl mb-12 shadow-lg border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Create New Video</h2>
          <form action={createProject} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">Topic</label>
              <input
                name="topic"
                type="text"
                placeholder="e.g., The mystery of the Mary Celeste"
                className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Visual Style</label>
                <select
                  name="style"
                  className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-purple-500 outline-none"
                >
                  <optgroup label="Realistic">
                    <option value="cinematic">Cinematic</option>
                    <option value="photorealistic">Photorealistic</option>
                    <option value="dark_ambient">Dark / Mystery</option>
                    <option value="bright_modern">Bright / Modern</option>
                    <option value="historical">Historical</option>
                    <option value="documentary">Documentary</option>
                  </optgroup>
                  <optgroup label="Artistic">
                    <option value="cartoon">Cartoon</option>
                    <option value="disney">Disney Style</option>
                    <option value="pixar">Pixar 3D</option>
                    <option value="anime">Anime</option>
                    <option value="studio_ghibli">Studio Ghibli</option>
                    <option value="oil_painting">Oil Painting</option>
                    <option value="watercolor">Watercolor</option>
                    <option value="sketch">Pencil Sketch</option>
                  </optgroup>
                  <optgroup label="Modern">
                    <option value="cyberpunk">Cyberpunk</option>
                    <option value="minimalist">Minimalist</option>
                    <option value="neon">Neon / Vaporwave</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Audio Language</label>
                <select
                  name="language"
                  className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-purple-500 outline-none"
                >
                  <option value="en">English</option>
                  <option value="it">Italian (Italiano)</option>
                  <option value="es">Spanish (Español)</option>
                  <option value="fr">French (Français)</option>
                  <option value="de">German (Deutsch)</option>
                  <option value="pt">Portuguese (Português)</option>
                  <option value="ja">Japanese (日本語)</option>
                  <option value="ko">Korean (한국어)</option>
                  <option value="zh">Chinese (中文)</option>
                  <option value="ar">Arabic (العربية)</option>
                  <option value="hi">Hindi (हिन्दी)</option>
                  <option value="ru">Russian (Русский)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">Video Format</label>
              <select
                name="format"
                className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-purple-500 outline-none"
              >
                <option value="vertical">Vertical 9:16 (TikTok, Reels, Shorts)</option>
                <option value="horizontal">Horizontal 16:9 (YouTube)</option>
                <option value="square">Square 1:1 (Instagram Post)</option>
                <option value="portrait">Portrait 4:5 (Instagram Feed)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 px-6 rounded-lg transition transform hover:scale-[1.02]"
            >
              Generate Video
            </button>
          </form>
        </div>

        {/* Project List */}
        <h2 className="text-2xl font-bold mb-6">Recent Projects</h2>
        <ProjectList projects={projects} />
      </div>
    </main>
  );
}
