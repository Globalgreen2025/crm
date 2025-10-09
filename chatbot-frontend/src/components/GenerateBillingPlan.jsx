import React, { useState, useEffect  } from 'react';
import { Modal, Form, Input, Button, DatePicker, message, Space, Card, Steps, Divider, Row, Col, Typography, Select, Alert } from 'antd';
import { PlusOutlined, MinusOutlined, DollarOutlined, CalendarOutlined, FileTextOutlined } from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';

const { Title, Text } = Typography;
const { Option } = Select;

const GenerateBillingPlan = ({ command, visible, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [planType, setPlanType] = useState('default');
  const [customInstallments, setCustomInstallments] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [totalWithForfait, setTotalWithForfait] = useState(0);

  useEffect(() => {
    if (command) {
      let calculatedTotal = command.totalTTC || 0;
      
      // Check if items exist and have forfait - FIXED: using items instead of products
      if (command.items && command.items.length > 0) {
        command.items.forEach(item => {
          if (item.forfait) {
            calculatedTotal += item.forfait;
          }
        });
      }
      
      setTotalWithForfait(calculatedTotal);
    }
  }, [command]);

  const handleGeneratePlan = async (values) => {
    try {
      let installments = [];
      let today = moment();
      
      if (planType === 'default') {
        installments = [
          { 
            percentage: 30, 
            dueDate: today.clone().add(1, 'month').toDate(), 
            description: 'Acompte' 
          },
          { 
            percentage: 70, 
            dueDate: today.clone().add(2, 'months').toDate(), 
            description: 'Intermédiaire' 
          }
        ];
      } else {
        installments = customInstallments;
      }
      
      const response = await axios.post(`/command/${command._id}/generate-billing-plan`, {
        planType,
        installments
      });

      console.log('Plan generated successfully:', response.data);
      
      message.success('Plan de facturation généré avec succès');
      onSuccess();
      onCancel();
      setCurrentStep(0);
    } catch (error) {
      message.error('Erreur lors de la génération du plan de facturation');
      console.error(error);
    }
  };

  // const handleGeneratePlan = async (values) => {
  //   try {
  //     let installments = [];
  //     let today = moment();
      
  //     if (planType === 'default') {
  //       installments = [
  //         { 
  //           percentage: 30, 
  //           dueDate: today.clone().add(1, 'month').toDate(), 
  //           description: 'Acompte' 
  //         },
  //         { 
  //           percentage: 70, 
  //           dueDate: today.clone().add(2, 'months').toDate(), 
  //           description: 'Intermédiaire' 
  //         }
  //       ];
  //     } else {
  //       installments = customInstallments;
  //     }
      
  //     const response = await axios.post(`/command/${command._id}/generate-billing-plan`, {
  //       planType,
  //       installments
  //     });

  //     console.log('Plan generated successfully:', response.data);
      
  //     message.success('Plan de facturation généré avec succès');
  //     onSuccess();
  //     onCancel();
  //     setCurrentStep(0);
  //   } catch (error) {
  //     message.error('Erreur lors de la génération du plan de facturation');
  //     console.error(error);
  //   }
  // };

  const addCustomInstallment = () => {
    setCustomInstallments([
      ...customInstallments,
      { percentage: 0, dueDate: moment(), description: '' }
    ]);
  };

  const removeCustomInstallment = (index) => {
    const newInstallments = [...customInstallments];
    newInstallments.splice(index, 1);
    setCustomInstallments(newInstallments);
  };

  const updateCustomInstallment = (index, field, value) => {
    const newInstallments = [...customInstallments];
    newInstallments[index][field] = value;
    setCustomInstallments(newInstallments);
  };

  // const totalPercentage = customInstallments.reduce((sum, inst) => sum + inst.percentage, 0);

  const totalPercentage = customInstallments.reduce((sum, inst) => sum + inst.percentage, 0);

  // Check if command has forfait - FIXED: using items instead of products
  const hasForfait = command?.items?.some(item => item.forfait);

  // Calculate forfait total - FIXED: using items instead of products
  const forfaitTotal = command?.items?.reduce((sum, item) => {
    return sum + (item.forfait || 0);
  }, 0) || 0;

  const steps = [
    {
      title: 'Configuration',
      content: (
        <div style={{ padding: '10px 0' }}>
          {/* Display forfait information */}
          {hasForfait && (
            <Alert
              message="Forfait inclus"
              description={`Un forfait de €${forfaitTotal.toFixed(2)} a été ajouté au total.`}
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />
          )}

          {planType === 'default' ? (
            <Card 
              title="Détails du plan standard" 
              style={{ borderRadius: '8px' }}
              headStyle={{ background: '#fafafa', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}
            >
              {/* Display total information */}
              <div style={{ padding: '12px', background: '#e6f7ff', borderRadius: '6px', marginBottom: '16px' }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Text strong>Total TTC original:</Text>
                  </Col>
                  <Col span={12}>
                    <Text>€{(command?.totalTTC || 0).toFixed(2)}</Text>
                  </Col>
                </Row>
                {hasForfait && (
                  <>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Text strong>Forfait ajouté:</Text>
                      </Col>
                      <Col span={12}>
                        <Text>+ €{forfaitTotal.toFixed(2)}</Text>
                      </Col>
                    </Row>
                    <Divider style={{ margin: '8px 0' }} />
                  </>
                )}
                <Row gutter={16}>
                  <Col span={12}>
                    <Text strong>Total avec forfait:</Text>
                  </Col>
                  <Col span={12}>
                    <Text strong>€{totalWithForfait.toFixed(2)}</Text>
                  </Col>
                </Row>
              </div>

              <div style={{ padding: '16px', background: '#f9f9f9', borderRadius: '6px' }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ 
                        width: '24px', 
                        height: '24px', 
                        borderRadius: '50%', 
                        background: '#1890ff', 
                        color: 'white', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        marginRight: '12px'
                      }}>
                        1
                      </div>
                      <div>
                        <Text strong>Acompte</Text>
                        <div>
                          <Text type="secondary">30% - À payer sous 30 jours</Text>
                        </div>
                      </div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ color: '#52c41a', fontWeight: 'bold' }}>
                      €{(totalWithForfait * 0.3).toFixed(2)}
                    </div>
                  </Col>
                </Row>
                
                <Row gutter={16}>
                  <Col span={12}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{ 
                        width: '24px', 
                        height: '24px', 
                        borderRadius: '50%', 
                        background: '#1890ff', 
                        color: 'white', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        marginRight: '12px'
                      }}>
                        2
                      </div>
                      <div>
                        <Text strong>Intermediaire</Text>
                        <div>
                          <Text type="secondary">70% - À payer sous 60 jours</Text>
                        </div>
                      </div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ color: '#52c41a', fontWeight: 'bold' }}>
                      €{(totalWithForfait * 0.7).toFixed(2)}
                    </div>
                  </Col>
                </Row>
              </div>
            </Card>
          ) : (
            <div>
              {/* Display forfait information for custom plan */}
              {hasForfait && (
                <Card style={{ marginBottom: '16px', background: '#f0f8ff', borderRadius: '8px' }}>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Text strong>Total original:</Text>
                      <div>€{(command?.totalTTC || 0).toFixed(2)}</div>
                    </Col>
                    <Col span={8}>
                      <Text strong>Forfait:</Text>
                      <div>+ €{forfaitTotal.toFixed(2)}</div>
                    </Col>
                    <Col span={8}>
                      <Text strong>Total avec forfait:</Text>
                      <div style={{ fontWeight: 'bold' }}>€{totalWithForfait.toFixed(2)}</div>
                    </Col>
                  </Row>
                </Card>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <Title level={5} style={{ margin: 0 }}>Configuration des tranches de paiement</Title>
                <Button 
                  type="dashed" 
                  onClick={addCustomInstallment}
                  icon={<PlusOutlined />}
                >
                  Ajouter une tranche
                </Button>
              </div>
              
              {customInstallments.length === 0 ? (
                <Card style={{ textAlign: 'center', padding: '40px', borderRadius: '8px' }}>
                  <CalendarOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
                  <div>
                    <Text type="secondary">Aucune tranche configurée. Cliquez sur "Ajouter une tranche" pour commencer.</Text>
                  </div>
                </Card>
              ) : (
                <div>
                  {customInstallments.map((inst, index) => (
                    <Card 
                      key={index} 
                      style={{ marginBottom: '16px', borderRadius: '8px' }}
                      title={`Tranche ${index + 1}`}
                      extra={
                        <Button
                          danger
                          type="text"
                          icon={<MinusOutlined />}
                          onClick={() => removeCustomInstallment(index)}
                        />
                      }
                    >
                      <Row gutter={16}>
                        <Col xs={24} sm={8}>
                          <div style={{ marginBottom: '8px' }}>
                            <Text strong>Pourcentage</Text>
                          </div>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={inst.percentage}
                            onChange={(e) => updateCustomInstallment(index, 'percentage', parseFloat(e.target.value))}
                            suffix="%"
                            style={{ width: '100%' }}
                          />
                        </Col>
                        <Col xs={24} sm={8}>
                          <div style={{ marginBottom: '8px' }}>
                            <Text strong>Date d'échéance</Text>
                          </div>
                          <DatePicker
                            value={inst.dueDate}
                            onChange={(date) => updateCustomInstallment(index, 'dueDate', date)}
                            style={{ width: '100%' }}
                          />
                        </Col>
                        <Col xs={24} sm={8}>
                          <div style={{ marginBottom: '8px' }}>
                            <Text strong>Description</Text>
                          </div>
                          <Select
                            value={inst.description}
                            onChange={(value) => updateCustomInstallment(index, 'description', value)}
                            placeholder="Choisir une description"
                            style={{ width: '100%' }}
                          >
                            <Select.Option value="Acompte">Acompte</Select.Option>
                            <Select.Option value="Intermediaire">Intermediaire</Select.Option>
                            <Select.Option value="Solde">Solde</Select.Option>
                          </Select>
                        </Col>
                      </Row>
                      <div style={{ marginTop: '12px', padding: '8px', background: '#f6ffed', border: '1px dashed #b7eb8f', borderRadius: '4px' }}>
                        <Text type="secondary">Montant: </Text>
                        <Text strong>€{(totalWithForfait * inst.percentage / 100).toFixed(2)}</Text>
                      </div>
                    </Card>
                  ))}
                  
                  <Card style={{ marginTop: '16px', background: '#fafafa', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text>Total configuré:</Text>
                      <Text strong>
                        {totalPercentage}%
                        {totalPercentage !== 100 && (
                          <Text type="danger" style={{ marginLeft: '8px' }}>
                            ({100 - totalPercentage}% {totalPercentage < 100 ? 'manquant' : 'en trop'})
                          </Text>
                        )}
                      </Text>
                    </div>
                  </Card>

                  {/* Warning message when total isn't 100% */}
                  {totalPercentage !== 100 && (
                    <Alert 
                      message="Attention" 
                      description={`Le total des pourcentages est de ${totalPercentage}% au lieu de 100%. Vous pouvez quand même générer le plan.`} 
                      type="warning" 
                      showIcon 
                      style={{ marginTop: '16px' }}
                    />
                  )}
                </div>
              )}
            </div>
          )}
          
          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between' }}>
            <Button onClick={() => setCurrentStep(0)}>
              Retour
            </Button>
            <Button 
              type="primary" 
              onClick={() => form.submit()}
            >
              Générer le plan
            </Button>
          </div>
        </div>
      ),
    },
  ];
//   const steps = [
//     {
//       title: 'Configuration',
//       content: (
//         <div style={{ padding: '10px 0' }}>
//           {planType === 'default' ? (
//             <Card 
//               title="Détails du plan standard" 
//               style={{ borderRadius: '8px' }}
//               headStyle={{ background: '#fafafa', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}
//             >
//               <div style={{ padding: '16px', background: '#f9f9f9', borderRadius: '6px' }}>
//                 <Row gutter={16}>
//                   <Col span={12}>
//                     <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
//                       <div style={{ 
//                         width: '24px', 
//                         height: '24px', 
//                         borderRadius: '50%', 
//                         background: '#1890ff', 
//                         color: 'white', 
//                         display: 'flex', 
//                         alignItems: 'center', 
//                         justifyContent: 'center',
//                         marginRight: '12px'
//                       }}>
//                         1
//                       </div>
//                       <div>
//                         <Text strong>Acompte</Text>
//                         <div>
//                           <Text type="secondary">30% - À payer sous 30 jours</Text>
//                         </div>
//                       </div>
//                     </div>
//                   </Col>
//                   <Col span={12}>
//                   <div style={{ color: '#52c41a', fontWeight: 'bold' }}>
//   {command?.totalTTC ? `€${(command.totalTTC * 0.3).toFixed(2)}` : 'Calcul en attente'}
// </div>
//                   </Col>
//                 </Row>
                
//                 <Row gutter={16}>
//                   <Col span={12}>
//                     <div style={{ display: 'flex', alignItems: 'center' }}>
//                       <div style={{ 
//                         width: '24px', 
//                         height: '24px', 
//                         borderRadius: '50%', 
//                         background: '#1890ff', 
//                         color: 'white', 
//                         display: 'flex', 
//                         alignItems: 'center', 
//                         justifyContent: 'center',
//                         marginRight: '12px'
//                       }}>
//                         2
//                       </div>
//                       <div>
//                         <Text strong>Intermediaire</Text>
//                         <div>
//                           <Text type="secondary">70% - À payer sous 60 jours</Text>
//                         </div>
//                       </div>
//                     </div>
//                   </Col>
//                   <Col span={12}>
//                   <div style={{ color: '#52c41a', fontWeight: 'bold' }}>
//   {command?.totalTTC ? `€${(command.totalTTC * 0.7).toFixed(2)}` : 'Calcul en attente'}
// </div>
//                   </Col>
//                 </Row>
//               </div>
//             </Card>
//           ) : (
//             <div>
//               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
//                 <Title level={5} style={{ margin: 0 }}>Configuration des tranches de paiement</Title>
//                 <Button 
//                   type="dashed" 
//                   onClick={addCustomInstallment}
//                   icon={<PlusOutlined />}
//                 >
//                   Ajouter une tranche
//                 </Button>
//               </div>
              
//               {customInstallments.length === 0 ? (
//                 <Card style={{ textAlign: 'center', padding: '40px', borderRadius: '8px' }}>
//                   <CalendarOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
//                   <div>
//                     <Text type="secondary">Aucune tranche configurée. Cliquez sur "Ajouter une tranche" pour commencer.</Text>
//                   </div>
//                 </Card>
//               ) : (
//                 <div>
//                   {customInstallments.map((inst, index) => (
//                     <Card 
//                       key={index} 
//                       style={{ marginBottom: '16px', borderRadius: '8px' }}
//                       title={`Tranche ${index + 1}`}
//                       extra={
//                         <Button
//                           danger
//                           type="text"
//                           icon={<MinusOutlined />}
//                           onClick={() => removeCustomInstallment(index)}
//                         />
//                       }
//                     >
//                       <Row gutter={16}>
//                         <Col xs={24} sm={8}>
//                           <div style={{ marginBottom: '8px' }}>
//                             <Text strong>Pourcentage</Text>
//                           </div>
//                           <Input
//                             type="number"
//                             min={0}
//                             max={100}
//                             value={inst.percentage}
//                             onChange={(e) => updateCustomInstallment(index, 'percentage', parseFloat(e.target.value))}
//                             suffix="%"
//                             style={{ width: '100%' }}
//                           />
//                         </Col>
//                         <Col xs={24} sm={8}>
//                           <div style={{ marginBottom: '8px' }}>
//                             <Text strong>Date d'échéance</Text>
//                           </div>
//                           <DatePicker
//                             value={inst.dueDate}
//                             onChange={(date) => updateCustomInstallment(index, 'dueDate', date)}
//                             style={{ width: '100%' }}
//                           />
//                         </Col>
                     
//                         <Col xs={24} sm={8}>
//   <div style={{ marginBottom: '8px' }}>
//     <Text strong>Description</Text>
//   </div>
//   <Select
//     value={inst.description}
//     onChange={(value) => updateCustomInstallment(index, 'description', value)}
//     placeholder="Choisir une description"
//     style={{ width: '100%' }}
//   >
//     <Select.Option value="Acompte">Acompte</Select.Option>
//     <Select.Option value="Intermediaire">Intermediaire</Select.Option>
//   </Select>
// </Col>
//                       </Row>
//                       {command?.totalPrice && (
//                         <div style={{ marginTop: '12px', padding: '8px', background: '#f6ffed', border: '1px dashed #b7eb8f', borderRadius: '4px' }}>
//                           <Text type="secondary">Montant: </Text>
//                           <Text strong>€{(command.totalTTC * inst.percentage / 100).toFixed(2)}</Text>
//                         </div>
//                       )}
//                     </Card>
//                   ))}
                  
//                   {command?.totalPrice && (
//                     <Card style={{ marginTop: '16px', background: '#fafafa', borderRadius: '8px' }}>
//                       <div style={{ display: 'flex', justifyContent: 'space-between' }}>
//                         <Text>Total configuré:</Text>
//                         <Text strong>
//                           {totalPercentage}%
//                           {totalPercentage !== 100 && (
//                             <Text type="danger" style={{ marginLeft: '8px' }}>
//                               ({100 - totalPercentage}% {totalPercentage < 100 ? 'manquant' : 'en trop'})
//                             </Text>
//                           )}
//                         </Text>
//                       </div>
//                     </Card>
//                   )}

//                   {/* Warning message when total isn't 100% */}
//                   {totalPercentage !== 100 && (
//                     <Alert 
//                       message="Attention" 
//                       description={`Le total des pourcentages est de ${totalPercentage}% au lieu de 100%. Vous pouvez quand même générer le plan.`} 
//                       type="warning" 
//                       showIcon 
//                       style={{ marginTop: '16px' }}
//                     />
//                   )}
//                 </div>
//               )}
//             </div>
//           )}
          
//           <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between' }}>
//             <Button onClick={() => setCurrentStep(0)}>
//               Retour
//             </Button>
//             <Button 
//               type="primary" 
//               onClick={() => form.submit()}
//             >
//               Générer le plan
//             </Button>
//           </div>
//         </div>
//       ),
//     },
//   ];

  return (
    <Modal
      title={(
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <FileTextOutlined style={{ color: '#1890ff', marginRight: '8px', fontSize: '20px' }} />
          <span>Générer le Plan de Facturation</span>
        </div>
      )}
      visible={visible}
      onCancel={() => {
        onCancel();
        setCurrentStep(0);
      }}
      footer={null}
      width={800}
      bodyStyle={{ padding: '24px' }}
      className="professional-billing-modal"
    >
      <Steps current={currentStep} style={{ marginBottom: '32px' }}>
        {steps.map(item => (
          <Steps.Step key={item.title} title={item.title} />
        ))}
      </Steps>
      
      <Form form={form} onFinish={handleGeneratePlan} layout="vertical">
        {steps[currentStep].content}
      </Form>
    </Modal>
  );
};

export default GenerateBillingPlan;