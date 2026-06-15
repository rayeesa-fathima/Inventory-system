import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ordermodal.css';

const createordermodal = ({ onClose, onSuccess, token, API }) => {
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([
    { product_id: '', quantity: 1 }
  ]);

  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    notes: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const headers = {
    Authorization: `Bearer ${token}`
  };

  useEffect(() => {
    axios
      .get(`${API}/products?limit=200&status=active`, {
        headers
      })
      .then((res) => {
        setProducts(res.data.data || res.data);
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        product_id: '',
        quantity: 1
      }
    ]);
  };

  const removeItem = (idx) => {
    setItems((prev) =>
      prev.filter((_, i) => i !== idx)
    );
  };

  const updateItem = (idx, field, value) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === idx
          ? { ...item, [field]: value }
          : item
      )
    );
  };

  const getProductInfo = (productId) => {
    return products.find(
      (p) => p.id === parseInt(productId)
    );
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const product = getProductInfo(item.product_id);

      return (
        sum +
        (product
          ? Number(product.price) *
            Number(item.quantity)
          : 0)
      );
    }, 0);
  };

  const handleSubmit = async () => {
    setError('');

    if (!form.customer_name.trim()) {
      return setError('Customer name is required');
    }

    const validItems = items.filter(
      (item) =>
        item.product_id &&
        Number(item.quantity) > 0
    );

    if (!validItems.length) {
      return setError(
        'Add at least one product'
      );
    }

    setSubmitting(true);

    try {
      await axios.post(
        `${API}/orders`,
        {
          ...form,
          items: validItems
        },
        { headers }
      );

      onSuccess();
    } catch (err) {
      console.log(
        'FULL ERROR:',
        err.response?.data
      );

      console.error(err);

      setError(
        err.response?.data?.message ||
          'Failed to create order'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div
        className="modal-box modal-lg"
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        <div className="modal-header">
          <h2>Create New Order</h2>

          <button
            className="modal-close"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="alert alert-danger">
              {error}
            </div>
          )}

          <div className="form-grid-2">
            <div className="form-group">
              <label>
                Customer Name *
              </label>

              <input
                className="form-input"
                value={form.customer_name}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    customer_name:
                      e.target.value
                  }))
                }
                placeholder="Enter customer name"
              />
            </div>

            <div className="form-group">
              <label>
                Customer Email
              </label>

              <input
                type="email"
                className="form-input"
                value={form.customer_email}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    customer_email:
                      e.target.value
                  }))
                }
                placeholder="Enter email"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Notes</label>

            <textarea
              rows={2}
              className="form-input"
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  notes:
                    e.target.value
                }))
              }
              placeholder="Optional notes..."
            />
          </div>

          <div className="order-items-section">
            <div className="items-header">
              <strong>
                Order Items
              </strong>

              <button
                className="btn btn-outline btn-sm"
                onClick={addItem}
              >
                + Add Item
              </button>
            </div>

            {items.map(
              (item, idx) => {
                const product =
                  getProductInfo(
                    item.product_id
                  );

                return (
                  <div
                    key={idx}
                    className="order-item-row"
                  >
                    <select
                      className="form-input"
                      value={
                        item.product_id
                      }
                      onChange={(e) =>
                        updateItem(
                          idx,
                          'product_id',
                          e.target.value
                        )
                      }
                    >
                      <option value="">
                        Select product...
                      </option>

                      {products.map(
                        (p) => (
                          <option
                            key={p.id}
                            value={p.id}
                          >
                            {p.name} — ₹
                            {p.price}
                          </option>
                        )
                      )}
                    </select>

                    <input
                      type="number"
                      min="1"
                      className="form-input qty-input"
                      value={
                        item.quantity
                      }
                      onChange={(e) =>
                        updateItem(
                          idx,
                          'quantity',
                          Number(
                            e.target
                              .value
                          ) || 1
                        )
                      }
                    />

                    <span className="item-subtotal">
                      {product
                        ? `₹${(
                            Number(
                              product.price
                            ) *
                            Number(
                              item.quantity
                            )
                          ).toLocaleString(
                            'en-IN'
                          )}`
                        : '—'}
                    </span>

                    {items.length >
                      1 && (
                      <button
                        className="btn btn-danger btn-icon btn-sm"
                        onClick={() =>
                          removeItem(
                            idx
                          )
                        }
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              }
            )}

            <div className="order-total">
              <strong>
                Total: ₹
                {calculateTotal().toLocaleString(
                  'en-IN'
                )}
              </strong>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-outline"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting
              ? 'Creating...'
              : 'Create Order'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default createordermodal;