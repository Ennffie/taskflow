import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { TaskList } from './pages/TaskList';
import { LogBook } from './pages/LogBook';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<TaskList />} />
          <Route path="/task/:taskId" element={<LogBook />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
