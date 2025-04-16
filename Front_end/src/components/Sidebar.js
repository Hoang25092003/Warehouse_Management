import React from 'react';
import { Nav, NavItem, NavLink } from 'reactstrap';
import { Link } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => (
  <div className="sidebar">
    <Nav vertical>
      <NavItem>
        <NavLink tag={Link} to="/">🏠 Trang chủ</NavLink>
      </NavItem>
      <NavItem>
        <NavLink tag={Link} to="/products">📋 Sản phẩm</NavLink>
      </NavItem>
      <NavItem>
        <NavLink tag={Link} to="/orders">📥 Đơn hàng</NavLink>
      </NavItem>
      <NavItem>
        <NavLink tag={Link} to="/reports">📊 Báo cáo</NavLink>
      </NavItem>
    </Nav>
  </div>
);

export default Sidebar;
