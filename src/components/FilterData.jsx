import React from 'react';
import { FaSearch } from 'react-icons/fa';
import { InputGroup, FormControl, Form, Button, Row, Col } from 'react-bootstrap';

const FilterData = ({
  inputRef,
  predictions,
  handleSelectPlace,
  selectedPlace,
  setSelectedPlace,
  materials,
  handleMaterialChange,
  createOptimizedRoute,
  createOrder,
  sendSMS
}) => {
  return (
    <section id="filter-data">
      <div className="row">
        {/* FILTER */}
        <div className="col-md-12 z-10">
          <InputGroup className="pl-4 pr-4 pt-4">
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <FormControl
              ref={inputRef}
              value={selectedPlace.replace(", Croatia", "")}
              onChange={(e) => setSelectedPlace(e.target.value)} // Update input value
              placeholder="Upiši lokaciju..."
              aria-label="Lokacija"
            />
          </InputGroup>
          {predictions.length > 0 && (
            <ul className="list-group position-absolute w-full pl-4 pr-4">
              {predictions.map((prediction) => (
                <li
                  key={prediction.id}
                  className="list-group-item list-group-item-action"
                  style={{ textAlign: "left" }} // Align the text to the left
                  onClick={() => handleSelectPlace(prediction)}
                >
                  {prediction.place_name.replace(", Croatia", "")}
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* ORDER */}
        <div className="col-md-12 mt-4">
          <h5>Odaberi sirovine</h5>
          <Form>
            {materials.map((item, index) => (
              <Form.Group as={Row} key={index} className="mb-3 align-items-center pr-4">
                <Col md={8} className="relative">
                  <div
                    style={{
                      top: 0,
                      bottom: 0,
                      left: '1.75rem',
                      position: 'absolute',
                      backgroundColor: item.color,
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      margin: 'auto',
                    }}
                  ></div>
                  <Form.Label
                    className="pl-8 float-left mb-0"
                    style={{ fontSize: '14px', lineHeight: '1', textAlign: 'left' }}
                  >
                    {item.material}
                  </Form.Label>
                </Col>
                <Col md={4}>
                  <InputGroup>
                    <Form.Control
                      type="number"
                      min="0"
                      placeholder="kg"
                      onChange={(e) => handleMaterialChange(index, item.material, e.target.value)}
                    />
                  </InputGroup>
                </Col>
              </Form.Group>
            ))}
            <div className="row pl-4 pr-4">
              <div className="col-md-12 z-10">
                <Button className="w-full mb-2" variant="primary" onClick={createOptimizedRoute}>
                  Kreiraj optimiziranu rutu
                </Button>
              </div>
              <div className="col-md-12 z-10 mb-2">
                <Button className="w-full" variant="secondary" onClick={createOrder}>
                  Kreiraj narudžbu
                </Button>
              </div>
              <div className="col-md-12 z-10">
                <Button className="w-full" variant="secondary" onClick={sendSMS}>
                  Pošalji rutu
                </Button>
              </div>
            </div>
          </Form>
        </div>
      </div>
    </section>
  );
};

export default FilterData;
