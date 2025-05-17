import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="container mx-auto py-6 px-4">
        <nav className="flex justify-between items-center">
          <div className="text-2xl font-bold text-indigo-600">InterviewIQ</div>
          <div className="flex gap-4">
            <Link href="/interview" className="px-4 py-2 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors">
              Try Demo
            </Link>
            <Link href="/login" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              Sign In
            </Link>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-16">
        <section className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Ace Your Next Interview with <span className="text-indigo-600">AI</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10">
            Practice with realistic mock interviews and get instant feedback on your performance.
          </p>
          <div className="flex justify-center gap-4">
            <Link 
              href="/interview" 
              className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-lg font-medium"
            >
              Start Free Interview <ArrowRight size={20} />
            </Link>
          </div>
        </section>

        <section className="mt-32 grid md:grid-cols-3 gap-8">
          {/* Feature cards */}
          {[
            {
              title: "Real-Time Feedback",
              description: "Get instant analysis on your speech patterns, filler words, and more.",
              icon: "⏱️"
            },
            {
              title: "Industry-Specific Questions",
              description: "Practice with questions tailored to your target job.",
              icon: "💼"
            },
            {
              title: "Progress Tracking",
              description: "Review your improvement over time with detailed reports.",
              icon: "📈"
            }
          ].map((feature, i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
