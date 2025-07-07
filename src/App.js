import React, { useState, useEffect } from "react";

export default function App() {
  const [ingresos, setIngresos] = useState(() => {
    const datos = localStorage.getItem("ingresos");
    return datos ? JSON.parse(datos) : [];
  });
  const [nuevoIngreso, setNuevoIngreso] = useState("");

  const [gastos, setGastos] = useState(() => {
    const datos = localStorage.getItem("gastos");
    return datos ? JSON.parse(datos) : [];
  });
  const [nuevoGasto, setNuevoGasto] = useState("");

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

  useEffect(() => {
    localStorage.setItem("ingresos", JSON.stringify(ingresos));
  }, [ingresos]);

  useEffect(() => {
    localStorage.setItem("gastos", JSON.stringify(gastos));
  }, [gastos]);

  useEffect(() => {
    localStorage.setItem("deudas", JSON.stringify(deudas));
  }, [deudas]);

  const agregarIngreso = () => {
    if (nuevoIngreso) {
      setIngresos([...ingresos, parseFloat(nuevoIngreso)]);
      setNuevoIngreso("");
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
      setDeudas([...deudas, { ...nuevaDeuda }]);
      setNuevaDeuda({ nombre: "", monto: "", interes: "", cuotas: "" });
    }
  };

  const totalIngresos = ingresos.reduce((a, b) => a + b, 0);
  const totalGastos = gastos.reduce((a, b) => a + b, 0);
  const totalDeudas = deudas.reduce((a, b) => a + parseFloat(b.monto), 0);
  const disponible = totalIngresos - totalGastos;

  // Calcula pago mensual total necesario para las deudas actuales
  const mensualidades = deudas.map((d) => {
    const monto = parseFloat(d.monto);
    const interes = parseFloat(d.interes) / 100 / 12;
    const cuotas = parseInt(d.cuotas);
    return interes > 0
      ? (monto * interes) / (1 - Math.pow(1 + interes, -cuotas))
      : monto / cuotas;
  });
  const totalMensualActual = mensualidades.reduce((a, b) => a + b, 0);

  // Estrategia bola de nieve: paga primero la deuda más chica, 
  // usa disponible para pagos mensuales y calcula meses totales
  const calcularBolaDeNieve = () => {
    if (deudas.length === 0) return null;
    if (disponible <= 0) return { mesesTotales: null, mensaje: "No hay dinero disponible para pagar las deudas." };

    // Ordenar de menor a mayor monto
    const deudasOrdenadas = [...deudas]
      .map(d => ({
        ...d,
        monto: parseFloat(d.monto),
        interes: parseFloat(d.interes) / 100 / 12,
        cuotas: parseInt(d.cuotas),
      }))
      .sort((a, b) => a.monto - b.monto);

    let mesesTotales = 0;
    let deudaPendiente = [...deudasOrdenadas];

    // Suponemos que pagas con el dinero disponible cada mes
    while (deudaPendiente.length > 0) {
      let pagoMensual = disponible;
      mesesTotales++;
      // Pagamos de a una deuda hasta cubrir pago mensual
      for (let i = 0; i < deudaPendiente.length && pagoMensual > 0; i++) {
        const d = deudaPendiente[i];

        // Calculamos cuota mensual para esta deuda según interés y cuotas restantes
        const cuotasRestantes = d.cuotas;
        const interes = d.interes;
        const monto = d.monto;

        const cuota = interes > 0
          ? (monto * interes) / (1 - Math.pow(1 + interes, -cuotasRestantes))
          : monto / cuotasRestantes;

        if (pagoMensual >= cuota) {
          // Pago completo de cuota
          d.monto -= cuota;
          d.cuotas--;
          pagoMensual -= cuota;
        } else {
          // Pago parcial, reduce monto proporcionalmente y cuotas no cambian
          d.monto -= pagoMensual;
          pagoMensual = 0;
        }
      }
      // Filtrar las deudas ya pagadas
      deudaPendiente = deudaPendiente.filter(d => d.monto > 0.01 && d.cuotas > 0);
    }

    return { mesesTotales };
  };

  const bolaDeNieve = calcularBolaDeNieve();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-100 py-10 px-4">
      <div className="bg-white shadow-lg rounded-2xl p-8 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-blue-700">Organizador de Finanzas</h1>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Ingresos</h2>
          <div className="flex gap-2 mb-2">
            <input
              type="number"
              value={nuevoIngreso}
              onChange={(e) => setNuevoIngreso(e.target.value)}
              className="border rounded px-2 py-1 w-full"
              placeholder="Agregar ingreso"
            />
            <button onClick={agregarIngreso} className="bg-green-500 hover:bg-green-600 text-white px-4 py-1 rounded">Agregar</button>
          </div>
          <p className="text-gray-600">Total ingresos: <span className="font-medium text-green-700">${totalIngresos}</span></p>
        </section>

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
              placeholder="Cuotas"
              value={nuevaDeuda.cuotas}
              onChange={(e) => setNuevaDeuda({ ...nuevaDeuda, cuotas: e.target.value })}
              className="border rounded px-2 py-1"
            />
          </div>
          <button onClick={agregarDeuda} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded mb-2">Agregar deuda</button>

          <ul className="mt-4 space-y-2">
            {deudas.map((d, idx) => (
              <li key={idx} className="border rounded px-4 py-2 bg-blue-50">
                <strong>{d.nombre}</strong>: ${d.monto} - {d.interes}% - {d.cuotas} cuotas
              </li>
            ))}
          </ul>
          <p className="text-gray-600 mt-2">Total deudas: <span className="font-medium text-blue-700">${totalDeudas}</span></p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Resumen</h2>
          <p className="text-gray-700">Disponible después de gastos: <span className="font-medium text-green-700">${disponible}</span></p>
          <p className="text-gray-700">Deuda total a cubrir: <span className="font-medium text-blue-700">${totalDeudas}</span></p>
        </section>

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