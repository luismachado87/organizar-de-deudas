import React, { useState, useEffect } from "react";

export default function App() {
  // Estado ingresos con origen y monto
  const [ingresos, setIngresos] = useState(() => {
    const datos = localStorage.getItem("ingresos");
    return datos ? JSON.parse(datos) : [];
  });
  const [nuevoIngreso, setNuevoIngreso] = useState({ origen: "", monto: "" });

  // Estado gastos
  const [gastos, setGastos] = useState(() => {
    const datos = localStorage.getItem("gastos");
    return datos ? JSON.parse(datos) : [];
  });
  const [nuevoGasto, setNuevoGasto] = useState("");

  // Estado deudas
  const [deudas, setDeudas] = useState(() => {
    const datos = localStorage.getItem("deudas");
    return datos ? JSON.parse(datos) : [];
  });
  const [nuevaDeuda, setNuevaDeuda] = useState({
    nombre: "",
    monto: "",
    interes: "",
    cuotas: ""
  });

  // Guardar en localStorage cuando cambian ingresos, gastos o deudas
  useEffect(() => {
    localStorage.setItem("ingresos", JSON.stringify(ingresos));
  }, [ingresos]);

  useEffect(() => {
    localStorage.setItem("gastos", JSON.stringify(gastos));
  }, [gastos]);

  useEffect(() => {
    localStorage.setItem("deudas", JSON.stringify(deudas));
  }, [deudas]);

  // Funciones para agregar datos
  const agregarIngreso = () => {
    if (nuevoIngreso.origen && nuevoIngreso.monto) {
      setIngresos([...ingresos, { origen: nuevoIngreso.origen, monto: parseFloat(nuevoIngreso.monto) }]);
      setNuevoIngreso({ origen: "", monto: "" });
    }
  };

  const agregarGasto = () => {
    if (nuevoGasto) {
      setGastos([...gastos, parseFloat(nuevoGasto)]);
      setNuevoGasto("");
    }
  };

  const agregarDeuda = () => {
    if (
      nuevaDeuda.nombre &&
      nuevaDeuda.monto &&
      nuevaDeuda.interes &&
      nuevaDeuda.cuotas
    ) {
      setDeudas([...deudas, { 
        nombre: nuevaDeuda.nombre, 
        monto: parseFloat(nuevaDeuda.monto), 
        interes: parseFloat(nuevaDeuda.interes), 
        cuotas: parseInt(nuevaDeuda.cuotas) 
      }]);
      setNuevaDeuda({ nombre: "", monto: "", interes: "", cuotas: "" });
    }
  };

  // Totales
  const totalIngresos = ingresos.reduce((a, b) => a + b.monto, 0);
  const totalGastos = gastos.reduce((a, b) => a + b, 0);
  const totalDeudas = deudas.reduce((a, b) => a + b.monto, 0);
  const disponible = totalIngresos - totalGastos;

  // Estrategia bola de nieve para proyección
  const calcularBolaDeNieve = () => {
    if (deudas.length === 0) return null;
    if (disponible <= 0) return { mesesTotales: null, mensaje: "No hay dinero disponible para pagar las deudas." };

    // Ordenar de menor a mayor monto
    const deudasOrdenadas = [...deudas]
      .map(d => ({
        ...d,
        monto: d.monto,
        interes: d.interes / 100 / 12,
        cuotas: d.cuotas,
      }))
      .sort((a, b) => a.monto - b.monto);

    let mesesTotales = 0;
    let deudaPendiente = [...deudasOrdenadas];

    while (deudaPendiente.length > 0) {
      let pagoMensual = disponible;
      mesesTotales++;
      for (let i = 0; i < deudaPendiente.length && pagoMensual > 0; i++) {
        const d = deudaPendiente[i];
        const cuotasRestantes = d.cuotas;
        const interes = d.interes;
        const monto = d.monto;

        const cuota = interes > 0
          ? (monto * interes) / (1 - Math.pow(1 + interes, -cuotasRestantes))
          : monto / cuotasRestantes;

        if (pagoMensual >= cuota) {
          d.monto -= cuota;
          d.cuotas--;
          pagoMensual -= cuota;
        } else {
          d.monto -= pagoMensual;
          pagoMensual = 0;
        }
      }
      deudaPendiente = deudaPendiente.filter(d => d.monto > 0.01 && d.cuotas > 0);
    }

    return { mesesTotales };
  };

  const bolaDeNieve = calcularBolaDeNieve();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-100 py-10 px-4">
      <div className="bg-white shadow-lg rounded-2xl p-8 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-blue-700">Organizador de Finanzas</h1>

        {/* Ingresos */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Ingresos</h2>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <input
              type="text"
              placeholder="Origen del ingreso"
              value={nuevoIngreso.origen}
              onChange={(e) => setNuevoIngreso({ ...nuevoIngreso, origen: e.target.value })}
              className="border rounded px-2 py-1 col-span-2"
            />
            <input
              type="number"
              placeholder="Monto"
              value={nuevoIngreso.monto}
              onChange={(e) => setNuevoIngreso({ ...nuevoIngreso, monto: e.target.value })}
              className="border rounded px-2 py-1"
            />
          </div>
          <button onClick={agregarIngreso} className="bg-green-500 hover:bg-green-600 text-white px-4 py-1 rounded mb-2">Agregar ingreso</button>

          <ul className="list-disc list-inside text-gray-700">
            {ingresos.map((ing, idx) => (
              <li key={idx}>{ing.origen}: ${ing.monto}</li>
            ))}
          </ul>

          <p className="text-gray-600 mt-2">Total ingresos: <span className="font-medium text-green-700">${totalIngresos}</span></p>
        </section>

        {/* Gastos */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Gastos</h2>
          <div className="flex gap-2 mb-2">
            <input
              type="number"
              value={nuevoGasto}
              onChange={(e) => setNuevoGasto(e.target.value)}
              className="border rounded px-2 py-1 w-full"
              placeholder="Agregar gasto"
            />
            <button onClick={agregarGasto} className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded">Agregar</button>
          </div>
          <p className="text-gray-600">Total gastos: <span className="font-medium text-red-700">${totalGastos}</span></p>
        </section>

        {/* Deudas */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Deudas</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
            <input
              type="text"
              placeholder="Nombre"
              value={nuevaDeuda.nombre}
              onChange={(e) => setNuevaDeuda({ ...nuevaDeuda, nombre: e.target.value })}
              className="border rounded px-2 py-1"
            />
            <input
              type="number"
              placeholder="Monto"
              value={nuevaDeuda.monto}
              onChange={(e) => setNuevaDeuda({ ...nuevaDeuda, monto: e.target.value })}
              className="border rounded px-2 py-1"
            />
            <input
              type="number"
              placeholder="Interés %"
              value={nuevaDeuda.interes}
              onChange={(e) => setNuevaDeuda({ ...nuevaDeuda, interes: e.target.value })}
              className="border rounded px-2 py-1"
            />
            <input
              type="number"
              placeholder="Duración (cuotas)"
              value={nuevaDeuda.cuotas}
              onChange={(e) => setNuevaDeuda({ ...nuevaDeuda, cuotas: e.target.value })}
              className="border rounded px-2 py-1"
            />
          </div>
          <button onClick={agregarDeuda} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded mb-2">Agregar deuda</button>

          <ul className="mt-4 space-y-2">
            {deudas.map((d, idx) => (
              <li key={idx} className="border rounded px-4 py-2 bg-blue-50">
                <strong>{d.nombre}</strong>: ${d.monto} - {d.interes}% interés - Duración: {d.cuotas} cuotas
              </li>
            ))}
          </ul>
          <p className="text-gray-600 mt-2">Total deudas: <span className="font-medium text-blue-700">${totalDeudas}</span></p>
        </section>

        {/* Resumen */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Resumen</h2>
          <p className="text-gray-700">Disponible después de gastos: <span className="font-medium text-green-700">${disponible}</span></p>
          <p className="text-gray-700">Deuda total a cubrir: <span className="font-medium text-blue-700">${totalDeudas}</span></p>
        </section>

        {/* Simulador Bola de Nieve */}
        <section className="mb-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Simulador Bola de Nieve</h2>
          {deudas.length > 0 ? (
            bolaDeNieve && bolaDeNieve.mesesTotales ? (
              <p className="text-gray-700">
                Tiempo estimado para salir de deudas con estrategia bola de nieve:{" "}
                <span className="font-medium">{bolaDeNieve.mesesTotales} meses</span>
              </p>
            ) : (
              <p className="text-red-600">{bolaDeNieve?.mensaje || "Calculando..."}</p>
            )
          ) : (
            <p className="text-gray-500">No hay deudas para simular.</p>
          )}
        </section>
      </div>
    </div>
  );
}