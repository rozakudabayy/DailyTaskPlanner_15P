import React from 'react';
import TaskItem from './TaskItem';

const TaskList = ({ tasks, toggleComplete, deleteTask, startEditing, showCompleted }) => {
  // Сортировка задач по приоритету и дате
  const sortedTasks = [...tasks].sort((a, b) => {
    // Первым приоритетом сортировки - завершенность
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    
    // Вторым приоритетом - важность задачи
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    if (a.priority !== b.priority) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    
    // Третьим приоритетом - дата выполнения
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate) - new Date(b.dueDate);
    } else if (a.dueDate) {
      return -1;
    } else if (b.dueDate) {
      return 1;
    }
    
    // В последнюю очередь - по ID (времени создания)
    return a.id - b.id;
  });

  // Фильтр для отображения задач
  const filteredTasks = showCompleted 
    ? sortedTasks 
    : sortedTasks.filter(task => !task.completed);
  
  return (
    <div className="space-y-3 mb-8">
      {filteredTasks.length === 0 ? (
        <div className="text-center p-8 text-gray-500">
          {showCompleted 
            ? "You don't have any tasks yet."
            : "You don't have any active tasks. All tasks are completed!"}
        </div>
      ) : (
        filteredTasks.map(task => (
          <TaskItem 
            key={task.id}
            task={task}
            toggleComplete={toggleComplete}
            deleteTask={deleteTask}
            startEditing={startEditing}
          />
        ))
      )}
    </div>
  );
};

export default TaskList;