import { useEffect, useMemo, useState } from "react";

// const API_BASE = "https://lxifjsnpj0.execute-api.us-east-1.amazonaws.com";
const API_BASE = "https://p1nqxfhotf.execute-api.us-east-1.amazonaws.com/Prod/";
const studentName = "Max Mustermann";
const matrikelNummer = "1234567";

async function apiFetch(path, options = {}) {
  const headers = {
    ...(options.headers || {}),
  };

  if (options.body) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = `API error: ${response.status}`;
    try {
      const errorBody = await response.json();
      message = errorBody.message || message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  return null;
}

export default function App() {
  const [exams, setExams] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);


  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const examsData = await apiFetch("/exams");
      setExams(examsData || []);

      try {
        const registrationsData = await apiFetch("/registrations");
        setRegistrations(registrationsData || []);
      } catch {
        setRegistrations([]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);
  

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const registeredIds = useMemo(
    () => new Set(registrations.map((r) => r.examId || r.examid)),
    [registrations]
  );

  async function handleRegister(examId) {
    setMessage("");
    setError("");
    setActionLoading(true);

    try {
      await apiFetch("/registrations", {
        method: "POST",
        body: JSON.stringify({ examId }),
      });

      setMessage(`Klausur ${examId} erfolgreich angemeldet.`);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleUnregister(examId) {
    setMessage("");
    setError("");
    setActionLoading(true);

    try {
      await apiFetch(`/registrations/${examId}`, {
        method: "DELETE",
      });

      setMessage(`Klausur ${examId} erfolgreich abgemeldet.`);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="bg-light min-vh-100">
      <div className="container py-4">
        <div className="bg-dark text-white rounded-4 p-4 shadow mb-4">
          <h1 className="mb-2">Klausuranmeldung für Studierende</h1>
          <p className="mb-0">
            Progressive Web-App Demo mit React und serverlosem AWS-Backend
          </p>
          <div className="badge bg-light text-dark fs-6 px-3 py-2">
            Angemeldet als: {studentName} ({matrikelNummer})
          </div>
        </div>

        <div className={`alert ${isOnline ? "alert-success" : "alert-warning"}`}>
          {isOnline
            ? "Online-Modus: Backend erreichbar"
            : "Offline-Modus: Anwendung läuft im Offline-Modus"}
        </div>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        {loading ? (
          <div className="d-flex justify-content-center align-items-center py-5">
            <div className="spinner-border text-dark me-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <span className="fs-5 text-secondary">Daten werden geladen ...</span>
          </div>
        ) : (
          <div className="row g-4">
            <div className="col-lg-8">
              <div className="card border-0 shadow-sm rounded-4">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h2 className="h4 mb-0">Verfügbare Klausuren</h2>
                    <button className="btn btn-outline-secondary" onClick={loadData}>
                      Aktualisieren
                    </button>
                  </div>

                  <div className="row g-3">
                    {exams.map((exam) => {
                      const examId = exam.examId || exam.examid;
                      return (
                        <div className="col-md-6" key={examId}>
                          <div className="card h-100 rounded-4 border">
                            <div className="card-body">
                              <h3 className="h5">{exam.title}</h3>
                              <p className="mb-1">
                                <strong>Datum:</strong> {exam.date}
                              </p>
                              <p className="mb-3">
                                <strong>ID:</strong> {examId}
                              </p>

                              {registeredIds.has(examId) ? (
                                <button
                                  className="btn btn-outline-danger"
                                  onClick={() => handleUnregister(examId)}
                                  disabled={actionLoading}
                                >
                                  {actionLoading ? "Bitte warten ..." : "Abmelden"}
                                </button>
                              ) : (
                                <button
                                  className="btn btn-dark"
                                  onClick={() => handleRegister(examId)}
                                  disabled={actionLoading}
                                >
                                  {actionLoading ? "Bitte warten ..." : "Anmelden"}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {exams.length === 0 && (
                    <div className="alert alert-warning mt-3 mb-0">
                      Keine Klausuren gefunden.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="card border-0 shadow-sm rounded-4">
                <div className="card-body">
                  <h2 className="h4">Meine Anmeldungen</h2>

                  {registrations.length === 0 ? (
                    <p className="text-muted mb-0">Noch keine Anmeldungen vorhanden.</p>
                  ) : (
                    <ul className="list-group list-group-flush">
                      {registrations.map((r) => {
                        const regExamId = r.examId || r.examid;
                        return (
                          <li
                            key={r.registrationId || r.registrationid || regExamId}
                            className="list-group-item d-flex justify-content-between align-items-center"
                          >
                            <span>{regExamId}</span>
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => handleUnregister(regExamId)}
                            >
                              Entfernen
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}