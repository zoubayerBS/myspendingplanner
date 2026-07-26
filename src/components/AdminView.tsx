import { useState, useEffect } from 'react';
import { getAllUsers, setActive, setRole, type UserProfile } from '../db/auth';

interface Props {
  onBack: () => void;
}

export default function AdminView({ onBack }: Props) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    setLoading(true);
    const data = await getAllUsers();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggle = async (userId: string, currentActive: boolean) => {
    await setActive(userId, !currentActive);
    await loadUsers();
  };

  const handleRole = async (userId: string, newRole: string) => {
    await setRole(userId, newRole);
    await loadUsers();
  };

  const pending = users.filter((u) => !u.isActive);
  const active = users.filter((u) => u.isActive);

  return (
    <div className="min-h-screen p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Administration</h1>
        <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700">
          Retour
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Chargement...</p>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-orange-600 mb-3">
                En attente d activation ({pending.length})
              </h2>
              <div className="space-y-2">
                {pending.map((u) => (
                  <div key={u.Id} className="border-2 border-dashed border-orange-200 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{u.name || u.email}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                    <button
                      onClick={() => handleToggle(u.userId, false)}
                      className="text-xs bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600"
                    >
                      Activer
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {active.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-green-600 mb-3">
                Actifs ({active.length})
              </h2>
              <div className="space-y-2">
                {active.map((u) => (
                  <div key={u.Id} className="border-2 border-dashed border-gray-200 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{u.name || u.email}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                      {u.role === 'admin' && (
                        <span className="text-xs text-blue-600 font-medium">Admin</span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {u.role === 'admin' ? (
                        <button
                          onClick={() => handleRole(u.userId, 'user')}
                          className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-lg hover:bg-blue-200"
                        >
                          Retirer admin
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRole(u.userId, 'admin')}
                          className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-lg hover:bg-blue-200"
                        >
                          Promouvoir
                        </button>
                      )}
                      <button
                        onClick={() => handleToggle(u.userId, true)}
                        className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-lg hover:bg-red-200"
                      >
                        Desactiver
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {users.length === 0 && (
            <p className="text-sm text-gray-500 text-center mt-8">Aucun utilisateur inscrit.</p>
          )}
        </>
      )}
    </div>
  );
}
