const Dashboard = () => {
  return (
    <div style={{ 
      height: "100vh", 
      width: "100vw",
      margin: 0,
      padding: 0,
      overflow: "hidden",
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    }}>
      <iframe
        title="SmartNotes BI Dashboard"
        src="https://app.powerbi.com/view?r=eyJrIjoiZDI3NTJiODQtZTYxZS00MzNjLWI3Y2YtOTgwNDMyYWE5ZTVmIiwidCI6ImI3YmQ0NzE1LTQyMTctNDhjNy05MTllLTJlYTk3ZjU5MmZhNyJ9"
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          display: "block"
        }}
        allowFullScreen
      />
    </div>
  );
};

export default Dashboard;