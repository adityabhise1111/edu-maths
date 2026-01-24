import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { examAPI } from '../services/api';
import { showSuccess, showError } from '../utils/notifications';
import DashboardLayout from './DashboardLayout/DashboardLayout';

const CreateExam = () => {
  const { academySlug } = useParams();
  const navigate = useNavigate();
  const { academy } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    difficulty: 'easy',
    totalQuestions: 10,
    durationMinutes: 30,
    startTime: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = 'Exam title is required';
    else if (formData.title.length < 3)
      newErrors.title = 'Title must be at least 3 characters';

    if (!formData.difficulty)
      newErrors.difficulty = 'Difficulty is required';

    const q = parseInt(formData.totalQuestions);
    if (!q || q < 1) newErrors.totalQuestions = 'Minimum 1 question';
    else if (q > 100) newErrors.totalQuestions = 'Maximum 100 questions';

    const d = parseInt(formData.durationMinutes);
    if (!d || d < 5) newErrors.durationMinutes = 'Minimum 5 minutes';
    else if (d > 300) newErrors.durationMinutes = 'Maximum 300 minutes';

    if (!formData.startTime) {
      newErrors.startTime = 'Start time required';
    } else {
      const now = new Date();
      const selected = new Date(formData.startTime);
      if (selected < now) newErrors.startTime = 'Must be future time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showError('Fix the errors');
      return;
    }

    try {
      setLoading(true);

      await examAPI.create({
        academyId: academy.id,
        title: formData.title.trim(),
        difficulty: formData.difficulty,
        totalQuestions: Number(formData.totalQuestions),
        durationMinutes: Number(formData.durationMinutes),
        startTime: new Date(formData.startTime).toISOString(),
      });

      showSuccess('Exam created successfully');
      navigate(`/${academySlug}/dashboard`);
    } catch (err) {
      showError(err.message || 'Failed to create exam');
    } finally {
      setLoading(false);
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  return (
    <DashboardLayout>
      <div style={{ minHeight: '100vh', background: 'var(--bg-secondary)' }}>
        <div className="container">
          <h2 style={{ marginBottom: '20px' }}>Create New Exam</h2>

          <form className="card" onSubmit={handleSubmit}>
            {/* Title */}
            <div className="form-group">
              <label>Exam Title</label>
              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="form-input"
              />
              {errors.title && <p className="error">{errors.title}</p>}
            </div>

            {/* Difficulty */}
            <div className="form-group">
              <label>Difficulty</label>
              <select
                name="difficulty"
                value={formData.difficulty}
                onChange={handleChange}
                className="form-input"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            {/* Questions */}
            <div className="form-group">
              <label>Total Questions</label>
              <input
                type="number"
                name="totalQuestions"
                value={formData.totalQuestions}
                onChange={handleChange}
                className="form-input"
              />
              {errors.totalQuestions && <p className="error">{errors.totalQuestions}</p>}
            </div>

            {/* Duration */}
            <div className="form-group">
              <label>Duration (minutes)</label>
              <input
                type="number"
                name="durationMinutes"
                value={formData.durationMinutes}
                onChange={handleChange}
                className="form-input"
              />
              {errors.durationMinutes && <p className="error">{errors.durationMinutes}</p>}
            </div>

            {/* Start Time */}
            <div className="form-group">
              <label>Start Time</label>
              <input
                type="datetime-local"
                name="startTime"
                value={formData.startTime}
                min={getMinDateTime()}
                onChange={handleChange}
                className="form-input"
              />
              {errors.startTime && <p className="error">{errors.startTime}</p>}
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-primary" disabled={loading}>
                {loading ? 'Creating...' : 'Create Exam'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate(`/${academySlug}/dashboard`)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreateExam;
