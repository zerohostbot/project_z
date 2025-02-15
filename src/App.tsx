import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import {
  Truck,
  Package,
  Building2,
  Store,
  ClipboardCheck,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Unlock,
  History,
  Users,
  Clock,
  Ban,
  Link as LinkIcon,
  Database,
  ShieldCheck
} from 'lucide-react';

// Компонент анимированной цепочки поставок
function SupplyChainAnimation({ isBlockchain }: { isBlockchain: boolean }) {
  const steps = [
    { icon: Building2, label: 'Производитель' },
    { icon: Truck, label: 'Доставка' },
    { icon: Store, label: 'Склад' },
    { icon: Package, label: 'Магазин' }
  ];

  return (
    <div className="relative py-10">
      <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2" />
      <div className="relative flex justify-between max-w-4xl mx-auto">
        {steps.map((Step, index) => (
          <motion.div
            key={index}
            className="relative z-10 flex flex-col items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.2 }}
          >
            <motion.div
              className={`w-16 h-16 rounded-full flex items-center justify-center ${
                isBlockchain ? 'bg-green-100' : 'bg-red-100'
              }`}
              whileHover={{ scale: 1.1 }}
            >
              <Step.icon className={`w-8 h-8 ${
                isBlockchain ? 'text-green-600' : 'text-red-600'
              }`} />
            </motion.div>
            <span className="mt-2 text-sm font-medium">{Step.label}</span>
            {isBlockchain && (
              <motion.div
                className="mt-2 text-xs px-2 py-1 bg-green-100 rounded-full text-green-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.2 + 0.3 }}
              >
                Блок #{index + 1}
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
      
      {/* Анимированные документы/транзакции */}
      <AnimatePresence>
        {steps.map((_, index) => index < steps.length - 1 && (
          <motion.div
            key={`doc-${index}`}
            className="absolute top-1/2 -translate-y-1/2"
            style={{ left: `${(index + 1) * (100 / steps.length)}%` }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 0],
              x: ['-50%', '0%', '50%'],
              scale: [0.8, 1, 0.8]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: index * 0.5
            }}
          >
            {isBlockchain ? (
              <Lock className="w-6 h-6 text-green-500" />
            ) : (
              <FileText className="w-6 h-6 text-red-500" />
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Компонент сравнения процессов
function ProcessComparison() {
  const [activeSystem, setActiveSystem] = useState<'traditional' | 'blockchain'>('traditional');
  
  const systems = {
    traditional: {
      title: 'Традиционная система',
      color: 'red',
      steps: [
        {
          icon: FileText,
          title: 'Бумажный документооборот',
          description: 'Множество документов, риск потери и подделки'
        },
        {
          icon: Clock,
          title: 'Длительные проверки',
          description: 'Каждый участник тратит время на проверку документов'
        },
        {
          icon: Users,
          title: 'Много посредников',
          description: 'Увеличение стоимости и времени обработки'
        },
        {
          icon: AlertTriangle,
          title: 'Риск мошенничества',
          description: 'Возможность подделки документов и данных'
        }
      ]
    },
    blockchain: {
      title: 'Система на блокчейне',
      color: 'green',
      steps: [
        {
          icon: Database,
          title: 'Единая база данных',
          description: 'Все участники работают в одной системе'
        },
        {
          icon: ShieldCheck,
          title: 'Мгновенная верификация',
          description: 'Автоматическая проверка всех транзакций'
        },
        {
          icon: LinkIcon,
          title: 'Прямое взаимодействие',
          description: 'Минимум посредников в цепочке поставок'
        },
        {
          icon: Lock,
          title: 'Защита от подделок',
          description: 'Невозможно изменить данные задним числом'
        }
      ]
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="flex justify-center space-x-4 mb-12">
        {(['traditional', 'blockchain'] as const).map((system) => (
          <button
            key={system}
            onClick={() => setActiveSystem(system)}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeSystem === system
                ? `bg-${systems[system].color}-100 text-${systems[system].color}-600`
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {systems[system].title}
          </button>
        ))}
      </div>

      <SupplyChainAnimation isBlockchain={activeSystem === 'blockchain'} />

      <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
        {systems[activeSystem].steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-6 rounded-lg bg-${systems[activeSystem].color}-50`}
          >
            <step.icon className={`w-10 h-10 text-${systems[activeSystem].color}-500 mb-4`} />
            <h3 className="font-semibold mb-2">{step.title}</h3>
            <p className="text-sm text-gray-600">{step.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Компонент демонстрации смарт-контракта
function SmartContractDemo() {
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const steps = [
    {
      title: 'Создание контракта',
      description: 'Производитель создает смарт-контракт с условиями поставки',
      icon: FileText
    },
    {
      title: 'Отправка товара',
      description: 'При отправке товара данные автоматически записываются в блокчейн',
      icon: Truck
    },
    {
      title: 'Проверка условий',
      description: 'Смарт-контракт автоматически проверяет соответствие условиям',
      icon: ClipboardCheck
    },
    {
      title: 'Оплата',
      description: 'При выполнении условий происходит автоматическая оплата',
      icon: CheckCircle2
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h3 className="text-2xl font-bold text-center mb-8">Работа смарт-контракта</h3>
      
      <div className="relative">
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2" />
        <div className="relative flex justify-between max-w-4xl mx-auto">
          {steps.map((s, index) => (
            <motion.div
              key={index}
              className="relative z-10 flex flex-col items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
            >
              <motion.div
                className={`w-16 h-16 rounded-full flex items-center justify-center cursor-pointer
                  ${step > index ? 'bg-green-100' : step === index + 1 ? 'bg-blue-100' : 'bg-gray-100'}`}
                whileHover={{ scale: 1.1 }}
                onClick={() => setStep(index + 1)}
              >
                {step > index ? (
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                ) : (
                  <s.icon className={`w-8 h-8 ${
                    step === index + 1 ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                )}
              </motion.div>
              <div className="mt-4 text-center max-w-[150px]">
                <h4 className="font-medium mb-1">{s.title}</h4>
                <p className="text-xs text-gray-600">{s.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <motion.div
        className="h-2 bg-gray-200 rounded-full mt-12 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <motion.div
          className="h-full bg-green-500"
          initial={{ width: '0%' }}
          animate={{ width: `${(step / totalSteps) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </motion.div>

      <div className="mt-8 flex justify-between">
        <button
          onClick={() => setStep(Math.max(1, step - 1))}
          className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
          disabled={step === 1}
        >
          Назад
        </button>
        <button
          onClick={() => setStep(Math.min(totalSteps, step + 1))}
          className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors"
          disabled={step === totalSteps}
        >
          Далее
        </button>
      </div>
    </div>
  );
}

// Компонент сравнения безопасности
function SecurityComparison() {
  const [showVulnerability, setShowVulnerability] = useState(false);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <motion.div
        className="bg-white rounded-xl shadow-lg p-8 relative overflow-hidden"
        whileHover={{ scale: 1.02 }}
      >
        <h3 className="text-xl font-bold text-red-600 mb-6">Традиционная система</h3>
        <div className="space-y-4">
          <div className="flex items-start space-x-4">
            <Unlock className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-medium">Уязвимые данные</h4>
              <p className="text-sm text-gray-600">Данные хранятся централизованно и могут быть изменены</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <History className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-medium">Сложность аудита</h4>
              <p className="text-sm text-gray-600">Трудно отследить историю изменений</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <Ban className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-medium">Отсутствие прозрачности</h4>
              <p className="text-sm text-gray-600">Ограниченный доступ к информации</p>
            </div>
          </div>
        </div>
        
        <motion.div
          className="absolute inset-0 bg-red-100 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: showVulnerability ? 0.9 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <AlertTriangle className="w-16 h-16 text-red-500" />
          <span className="ml-4 text-lg font-medium text-red-700">Данные скомпрометированы!</span>
        </motion.div>
        
        <button
          className="mt-6 px-4 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
          onClick={() => setShowVulnerability(!showVulnerability)}
        >
          {showVulnerability ? 'Скрыть уязвимость' : 'Показать уязвимость'}
        </button>
      </motion.div>

      <motion.div
        className="bg-white rounded-xl shadow-lg p-8"
        whileHover={{ scale: 1.02 }}
      >
        <h3 className="text-xl font-bold text-green-600 mb-6">Блокчейн система</h3>
        <div className="space-y-4">
          <div className="flex items-start space-x-4">
            <Lock className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-medium">Защищенные данные</h4>
              <p className="text-sm text-gray-600">Криптографическая защита всех транзакций</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <History className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-medium">Полная история</h4>
              <p className="text-sm text-gray-600">Неизменяемая история всех операций</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <Users className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-medium">Прозрачность</h4>
              <p className="text-sm text-gray-600">Все участники видят актуальные данные</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <motion.div
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.1 }}
            transition={{ duration: 1.5 }}
          >
            <img
              src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80"
              alt="Logistics Background"
              className="w-full h-full object-cover"
            />
          </motion.div>
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-6xl font-bold text-gray-900 mb-6"
          >
            Революция в логистике с блокчейном
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-xl text-gray-700"
          >
            Увеличьте эффективность, безопасность и прозрачность цепочки поставок
          </motion.p>
        </div>
      </section>

      {/* Process Comparison Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl font-bold text-center mb-16"
          >
            Сравнение процессов
          </motion.h2>
          <ProcessComparison />
        </div>
      </section>

      {/* Smart Contract Demo Section */}
      <section className="py-20 px-4 bg-gray-100">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl font-bold text-center mb-16"
          >
            Автоматизация с помощью смарт-контрактов
          </motion.h2>
          <SmartContractDemo />
        </div>
      </section>

      {/* Security Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl font-bold text-center mb-16"
          >
            Безопасность и прозрачность
          </motion.h2>
          <SecurityComparison />
        </div>
      </section>
    </div>
  );
}

export default App;