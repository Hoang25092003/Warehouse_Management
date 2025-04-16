import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Form, Input, Button, Select, DatePicker, message, Card, Row, Col, Divider, Typography, Spin, Statistic } from 'antd';
import { ShoppingCartOutlined, ImportOutlined, ExportOutlined, CheckOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import moment from 'moment';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

const ProductDisplay = () => {
  const { barcode } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deviceInfo, setDeviceInfo] = useState({});
  const [form] = Form.useForm();
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [quantityInput, setQuantityInput] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Get device info from URL
        const urlParams = new URLSearchParams(window.location.search);
        const deviceId = urlParams.get('device_id');
        const deviceType = urlParams.get('device_type') || 'check';
        
        setDeviceInfo({
          id: deviceId,
          type: deviceType
        });

        // Fetch necessary data
        const [categoriesRes, suppliersRes, warehousesRes] = await Promise.all([
          axios.get('http://localhost:3000/api/categories'),
          axios.get('http://localhost:3000/api/suppliers'),
          axios.get('http://localhost:3000/api/warehouses')
        ]);
        
        setCategories(categoriesRes.data);
        setSuppliers(suppliersRes.data);
        setWarehouses(warehousesRes.data);

        // Fetch product info
        const productRes = await axios.get(`http://localhost:3000/api/products/${barcode}?device_id=${deviceId}`);
        
        if (productRes.data.source === 'external' && deviceType === 'import') {
          // External product for import
          const externalProduct = {
            ...productRes.data.data,
            product_id: `EXT_${Date.now()}`,
            quantity: 0,
            unit_price: productRes.data.data.unit_price || 0,
            production_date: new Date(),
            expiration_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
            supplier_id: null,
            category_id: categoriesRes.data[0]?.category_id || null,
            warehouse_id: warehousesRes.data[0]?.warehouse_id || null
          };
          setProduct(externalProduct);
          form.setFieldsValue({
            ...externalProduct,
            production_date: moment(externalProduct.production_date),
            expiration_date: moment(externalProduct.expiration_date)
          });
        } else {
          // Local product
          setProduct(productRes.data.data);
          form.setFieldsValue({
            ...productRes.data.data,
            production_date: moment(productRes.data.data.production_date),
            expiration_date: moment(productRes.data.data.expiration_date)
          });
        }

        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load product information');
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [barcode, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const updatedProduct = {
        ...values,
        production_date: values.production_date.format('YYYY-MM-DD'),
        expiration_date: values.expiration_date.format('YYYY-MM-DD')
      };

      let response;
      if (deviceInfo.type === 'import' && product.product_id.startsWith('EXT_')) {
        // Create new product
        response = await axios.post('http://localhost:3000/api/products', updatedProduct);
        message.success('Product added successfully');
      } else {
        // Update product
        response = await axios.put(`http://localhost:3000/api/products/${product.product_id}`, updatedProduct);
        message.success('Product updated successfully');
      }

      setProduct(response.data);
      if (deviceInfo.type === 'check') {
        navigate('/');
      }
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to save product');
    }
  };

  const handleInventoryAction = async (actionType) => {
    setActionLoading(true);
    try {
      const values = await form.validateFields();
      const quantity = quantityInput;
      const warehouseId = values.warehouse_id;

      if (!warehouseId) {
        throw new Error('Please select a warehouse');
      }

      let endpoint, successMessage;
      switch (actionType) {
        case 'import':
          endpoint = 'http://localhost:3000/api/inventory/import';
          successMessage = 'Products imported successfully';
          break;
        case 'export':
          endpoint = 'http://localhost:3000/api/inventory/export';
          successMessage = 'Products exported successfully';
          break;
        default:
          throw new Error('Invalid action type');
      }

      await axios.post(endpoint, {
        product_id: product.product_id,
        warehouse_id: warehouseId,
        quantity: quantity,
        unit_price: values.unit_price
      });

      message.success(successMessage);
      navigate('/');
    } catch (err) {
      message.error(err.response?.data?.message || err.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const getActionButton = () => {
    switch (deviceInfo.type) {
      case 'import':
        return (
          <Button 
            type="primary" 
            icon={<ImportOutlined />}
            onClick={() => handleInventoryAction('import')}
            loading={actionLoading}
            size="large"
            style={{ width: '100%' }}
          >
            Import ({quantityInput})
          </Button>
        );
      case 'export':
        return (
          <Button 
            type="primary" 
            icon={<ExportOutlined />}
            onClick={() => handleInventoryAction('export')}
            loading={actionLoading}
            size="large"
            style={{ width: '100%' }}
            danger
          >
            Export ({quantityInput})
          </Button>
        );
      case 'check':
      default:
        return (
          <Button 
            type="primary" 
            icon={<CheckOutlined />}
            onClick={handleSave}
            loading={actionLoading}
            size="large"
            style={{ width: '100%' }}
          >
            Save Changes
          </Button>
        );
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Spin size="large" tip="Loading product information..." />
    </div>
  );
  
  if (error) return (
    <Card style={{ margin: 16 }}>
      <Title level={4} type="danger">Error</Title>
      <Text>{error}</Text>
      <Divider />
      <Button type="default" icon={<ArrowLeftOutlined />} onClick={() => navigate('/')}>
        Go Back
      </Button>
    </Card>
  );
  
  if (!product) return (
    <Card style={{ margin: 16 }}>
      <Title level={4}>Product Not Found</Title>
      <Text>No product found with barcode: {barcode}</Text>
      <Divider />
      <Button type="default" icon={<ArrowLeftOutlined />} onClick={() => navigate('/')}>
        Go Back
      </Button>
    </Card>
  );

  return (
    <div style={{ padding: 16 }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card>
            <Title level={4} style={{ marginBottom: 0 }}>
              <ShoppingCartOutlined /> Product Information
            </Title>
            <Text type="secondary">Barcode: {barcode}</Text>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card>
            <Form
              form={form}
              layout="vertical"
              initialValues={product}
              disabled={deviceInfo.type === 'export' && !product.product_id.startsWith('EXT_')}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Product ID" name="product_id">
                    <Input disabled />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Barcode" name="barcode">
                    <Input disabled />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item 
                label="Product Name" 
                name="name"
                rules={[{ required: true, message: 'Please enter product name' }]}
              >
                <Input />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item 
                    label="Category" 
                    name="category_id"
                    rules={[{ required: true, message: 'Please select category' }]}
                  >
                    <Select>
                      {categories.map(category => (
                        <Option key={category.category_id} value={category.category_id}>
                          {category.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item 
                    label="Supplier" 
                    name="supplier_id"
                  >
                    <Select allowClear>
                      {suppliers.map(supplier => (
                        <Option key={supplier.supplier_id} value={supplier.supplier_id}>
                          {supplier.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item 
                    label="Unit Price (VND)" 
                    name="unit_price"
                    rules={[{ required: true, message: 'Please enter unit price' }]}
                  >
                    <Input type="number" min={0} step={1000} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item 
                    label="Quantity in Stock" 
                    name="quantity"
                    rules={[{ required: true, message: 'Please enter quantity' }]}
                  >
                    <Input type="number" min={0} disabled={deviceInfo.type !== 'check'} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item 
                    label="Production Date" 
                    name="production_date"
                    rules={[{ required: true, message: 'Please select production date' }]}
                  >
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item 
                    label="Expiration Date" 
                    name="expiration_date"
                    rules={[{ required: true, message: 'Please select expiration date' }]}
                  >
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item 
                label="Warehouse" 
                name="warehouse_id"
                rules={[{ required: deviceInfo.type !== 'check', message: 'Please select warehouse' }]}
              >
                <Select>
                  {warehouses.map(warehouse => (
                    <Option key={warehouse.warehouse_id} value={warehouse.warehouse_id}>
                      {warehouse.name} ({warehouse.location})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card>
            <div style={{ marginBottom: 16 }}>
              <Statistic 
                title="Current Operation" 
                value={deviceInfo.type.toUpperCase()} 
                style={{ textTransform: 'capitalize' }}
              />
            </div>

            {(deviceInfo.type === 'import' || deviceInfo.type === 'export') && (
              <>
                <Divider orientation="left">Quantity</Divider>
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={24}>
                    <Input 
                      type="number" 
                      min={1} 
                      value={quantityInput} 
                      onChange={(e) => setQuantityInput(parseInt(e.target.value) || 1)}
                      style={{ textAlign: 'center', fontSize: '1.2rem' }}
                    />
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={6}>
                    <Button 
                      onClick={() => setQuantityInput(1)}
                      block
                    >
                      1
                    </Button>
                  </Col>
                  <Col span={6}>
                    <Button 
                      onClick={() => setQuantityInput(5)}
                      block
                    >
                      5
                    </Button>
                  </Col>
                  <Col span={6}>
                    <Button 
                      onClick={() => setQuantityInput(10)}
                      block
                    >
                      10
                    </Button>
                  </Col>
                  <Col span={6}>
                    <Button 
                      onClick={() => setQuantityInput(quantityInput + 1)}
                      block
                    >
                      +1
                    </Button>
                  </Col>
                </Row>
              </>
            )}

            <Divider orientation="left">Actions</Divider>
            {getActionButton()}
            
            <Button 
              onClick={() => navigate('/')} 
              style={{ marginTop: 16, width: '100%' }}
              icon={<ArrowLeftOutlined />}
            >
              Back to Scanner
            </Button>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProductDisplay;