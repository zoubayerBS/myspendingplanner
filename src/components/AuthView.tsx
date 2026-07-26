import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AnimatedLogo from './AnimatedLogo';

interface Props {
  onNavigateToAdmin?: () => void;
}

export default function AuthView({ onNavigateToAdmin }: Props) {
  const { login, register, error, loading } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg('');

    if (isRegister) {
      const res = await register(email, password, name);
      if (res.ok && res.needsActivation) {
        setMsg('Compte cree ! En attente d activation par l administrateur.');
      }
    } else {
      await login(email, password);
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mb-4">
            <AnimatedLogo />
          </div>
          <h1 className="text-2xl font-bold">Spending Planner</h1>
          <p className="text-sm text-gray-500 mt-1">Gerez vos depenses simplement</p>
        </div>

        <div className="border-2 border-dashed border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">
            {isRegister ? 'Creer un compte' : 'Se connecter'}
          </h2>

          {msg && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 mb-4 text-sm">
              {msg}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {isRegister && (
              <input
                type="text"
                placeholder="Nom"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
            />
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
            />

            <button
              type="submit"
              disabled={submitting || loading}
              className="w-full bg-gray-900 text-white rounded-lg py-2 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {submitting ? '...' : isRegister ? "S'inscrire" : 'Se connecter'}
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-gray-500">
            {isRegister ? 'Deja un compte ?' : "Pas encore de compte ?"}{' '}
            <button
              onClick={() => { setIsRegister(!isRegister); setMsg(''); }}
              className="text-gray-900 font-medium hover:underline"
            >
              {isRegister ? 'Se connecter' : "S'inscrire"}
            </button>
          </div>
        </div>

        <div className="text-center mt-4">
          <button
            onClick={onNavigateToAdmin}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Admin
          </button>
        </div>
      </div>
    </div>
  );
}
