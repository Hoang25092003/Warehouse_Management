# Warehouse Management System

This is a React-based web application for managing warehouse operations, including product inventory, orders, and reports.

## Features
- Responsive layout using **Bootstrap**.
- Sidebar with toggle functionality (open/close).
- Smooth sliding effect for the sidebar.
- Font Awesome icons for better UI/UX.
- Dynamic routing using **React Router**.

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-folder>
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

## Libraries and Tools Used

### Core Libraries
- **React**: Frontend framework.
- **React Router**: For routing and navigation.
- **Bootstrap**: For responsive design and styling.
- **React-Bootstrap**: Bootstrap components for React.

### Icons
- **Font Awesome**: For icons used in the sidebar toggle button.

### Additional Tools
- **CSS Transitions**: For smooth sidebar sliding effects.

## Configuration Details

### Installed Dependencies
Run the following commands to install the required dependencies:

1. **React Router**:
   ```bash
   npm install react-router-dom
   ```

2. **Bootstrap and React-Bootstrap**:
   ```bash
   npm install bootstrap react-bootstrap
   ```

3. **Font Awesome**:
   ```bash
   npm install @fortawesome/react-fontawesome @fortawesome/free-solid-svg-icons @fortawesome/fontawesome-svg-core
   ```

### File Structure
The project is organized as follows:
```
src/
├── components/
│   ├── Layout.js       # Layout component with sidebar and toggle functionality
│   ├── Layout.css      # Styling for the Layout component
├── pages/
│   ├── Home.js         # Home page with dashboard cards
│   ├── Inventory.js    # Inventory management page
│   ├── Reports.js      # Reports page
│   ├── ScanProducts.js # Scan products page
├── App.js              # Main application file with routing
├── index.js            # Entry point of the application
```

### Key Features Implemented
1. **Sidebar Toggle**:
   - The sidebar can be opened or closed using a button.
   - The button dynamically adjusts its position based on the sidebar state.
   - Smooth sliding effect is implemented using CSS transitions.

2. **Responsive Design**:
   - Bootstrap is used for responsive layouts.
   - The sidebar and main content dynamically adjust their widths.

3. **Font Awesome Icons**:
   - Icons are used for the sidebar toggle button (`faBars` and `faTimes`).

4. **Default Sidebar State**:
   - The sidebar is closed by default when the application is loaded.

### CSS Customizations
- Smooth sliding effect for the sidebar:
  ```css
  .sidebar {
    transition: transform 0.3s ease;
  }
  .sidebar-open {
    transform: translateX(0);
  }
  .sidebar-closed {
    transform: translateX(-100%);
  }
  ```

- Prevent horizontal scrolling:
  ```css
  .container-fluid {
    overflow-x: hidden;
  }
  ```

## How to Use
1. Start the application using `npm start`.
2. Navigate through the pages using the sidebar.
3. Use the toggle button to open or close the sidebar.

## Future Enhancements
- Add authentication for secure access.
- Integrate backend APIs for dynamic data.
- Add more detailed reports and analytics.

## License
This project is licensed under the MIT License.