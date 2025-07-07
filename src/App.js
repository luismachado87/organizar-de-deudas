import React, { useState, useEffect } from "react";
import './App.css';

export default function App() {
  const [ingresos, setIngresos] = useState(() => {
    const datos = localStorage.getItem("ingresos");
    return datos ? JSON.parse(datos) : [];
  });
  const [nuevoIngreso, setNuevoIngreso] = useState({ origen: "", monto: "" });

  const [gastos, setGastos] = useState(() => {
    const datos = localStorage.getItem("gastos");
    return datos ? JSON.parse(datos) : [];
  });
  const [nuevoGasto, setNuevoGasto] = useState({ categoria: "", monto: "" });

  const [deudas, setDeudas] = useState(() => {
    const datos = localStorage.getItem("deudas");
    return datos ? JSON.parse(datos) : [];
  });
  const [nuevaDeuda, setNuevaDeuda] = useState({
    nombre: "",
    monto: "",
    interes: "",
    cuotas: "",
  });

  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

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
    if (nuevoIngreso.origen && nuevoIngreso.monto) {
      setIngresos([
        ...ingresos,
        { ...nuevoIngreso, monto: parseFloat(nuevoIngreso.monto) },
      ]);
      setNuevoIngreso({ origen: "", monto: "" });
    }
  };

  const agregarGasto = () => {
    if (nuevoGasto.categoria && nuevoGasto.monto) {
      setGastos([...gastos, { ...nuevoGasto, monto: parseFloat(nuevoGasto.monto) }]);
      setNuevoGasto({ categoria: "", monto: "" });
    }
  };

  const agregarDeuda = () => {
    if (
      nuevaDeuda.nombre &&
      nuevaDeuda.monto &&
      nuevaDeuda.interes !== "" &&
      nuevaDeuda.cuotas
    ) {
      setDeudas([
        ...deudas,
        {
          ...nuevaDeuda,
          monto: parseFloat(nuevaDeuda.monto),
          interes: parseFloat(nuevaDeuda.interes),
          cuotas: parseInt(nuevaDeuda.cuotas),
        },
      ]);
      setNuevaDeuda({ nombre: "", monto: "", interes: "", cuotas: "" });
    }
  };

  const eliminarIngreso = (index) => {
    const nuevos = [...ingresos];
    nuevos.splice(index, 1);
    setIngresos(nuevos);
  };

  const eliminarGasto = (index) => {
    const nuevos = [...gastos];
    nuevos.splice(index, 1);
    setGastos(nuevos);
  };

  const eliminarDeuda = (index) => {
    const nuevos = [...deudas];
    nuevos.splice(index, 1);
    setDeudas(nuevos);
  };

  const resetearTodo = () => {
    setIngresos([]);
    setGastos([]);
    setDeudas([]);
    localStorage.removeItem("ingresos");
    localStorage.removeItem("gastos");
    localStorage.removeItem("deudas");
    setMostrarConfirmacion(false);
  };

  const totalIngresos = ingresos.reduce((a, b) => a + b.monto, 0);
  const totalGastos = gastos.reduce((a, b) => a + b.monto, 0);
  const disponible = totalIngresos - totalGastos;

  function calcularBolaDeNieveAvanzado(deudas, pagoMensual) {
    if (deudas.length === 0 || pagoMensual <= 0) return { detalle: [], resumen: {} };

    let pendientes = deudas
      .map((d) => ({
        nombre: d.nombre,
        saldo: d.monto,
        interesMensual: d.interes / 100 / 12,
        cuotasRestantes: d.cuotas,
        pagoMinimo: d.monto / d.cuotas,
      }))
      .sort((a, b) => a.saldo - b.saldo);

    let meses = 0;
    const detalleMeses = [];
    const resumenPorDeuda = {};

    while (pendientes.length > 0) {
      meses++;
      let pagoDisponible = pagoMensual;
      const mesActual = { mes: meses, pagos: [], totalPagado: 0 };

      pendientes.forEach((d) => {
        d.saldo += d.saldo * d.interesMensual;
      });

      for (let i = 0; i < pendientes.length; i++) {
        const d = pendientes[i];

        const pagoMinimoActual = Math.min(d.saldo, d.pagoMinimo);
        let pago = Math.min(pagoDisponible, pagoMinimoActual);

        d.saldo -= pago;
        d.cuotasRestantes--;

        let pagoExtra = 0;
        if (pagoDisponible - pago > 0 && d.saldo > 0) {
          pagoExtra = Math.min(pagoDisponible - pago, d.saldo);
          d.saldo -= pagoExtra;
          pago += pagoExtra;
        }

        pagoDisponible -= pago;
        mesActual.totalPagado += pago;

        mesActual.pagos.push({
          nombre: d.nombre,
          pago: pago.toFixed(2),
          saldoRestante: d.saldo.toFixed(2),
          cuotasRestantes: d.cuotasRestantes,
        });

        if (d.saldo <= 0.01 && !resumenPorDeuda[d.nombre]) {
          resumenPorDeuda[d.nombre] = meses;
        }
      }

      pendientes = pendientes.filter((d) => d.saldo > 0.01);
      pendientes.sort((a, b) => a.saldo - b.saldo);
      detalleMeses.push(mesActual);

      if (pagoDisponible === pagoMensual) break;
    }

    return { detalle: detalleMeses, resumen: resumenPorDeuda };
  }

  const { detalle, resumen } = calcularBolaDeNieveAvanzado(deudas, disponible);

  return (
    <div className="app-container">
      <h1 className="app-title">Simulador Bola de Nieve Avanzado</h1>

      {mostrarConfirmacion ? (
        <div className="confirmacion">
          <p>¿Estás seguro de que querés reiniciar todo?</p>
          <button onClick={resetearTodo} className="btn btn-danger">Sí, borrar todo</button>
          <button onClick={() => setMostrarConfirmacion(false)} className="btn btn-cancelar">Cancelar</button>
        </div>
      ) : (
        <button onClick={() => setMostrarConfirmacion(true)} className="btn btn-reset">Reiniciar Todo</button>
      )}

      {/* Formularios para agregar */}
      <div className="formulario">
        <h2>Agregar Ingreso</h2>
        <input
          type="text"
          placeholder="Origen ingreso"
          value={nuevoIngreso.origen}
          onChange={(e) => setNuevoIngreso({ ...nuevoIngreso, origen: e.target.value })}
          className="input"
        />
        <input
          type="number"
          placeholder="Monto"
          value={nuevoIngreso.monto}
          onChange={(e) => setNuevoIngreso({ ...nuevoIngreso, monto: e.target.value })}
          className="input"
        />
        <button onClick={agregarIngreso} className="btn btn-agregar">Agregar</button>
      </div>

      <div className="formulario">
        <h2>Agregar Gasto</h2>
        <input
          type="text"
          placeholder="Categoría gasto"
          value={nuevoGasto.categoria}
          onChange={(e) => setNuevoGasto({ ...nuevoGasto, categoria: e.target.value })}
          className="input"
        />
        <input
          type="number"
          placeholder="Monto"
          value={nuevoGasto.monto}
          onChange={(e) => setNuevoGasto({ ...nuevoGasto, monto: e.target.value })}
          className="input"
        />
        <button onClick={agregarGasto} className="btn btn-agregar">Agregar</button>
      </div>

      <div className="formulario">
        <h2>Agregar Deuda</h2>
        <input
          type="text"
          placeholder="Nombre deuda"
          value={nuevaDeuda.nombre}
          onChange={(e) => setNuevaDeuda({ ...nuevaDeuda, nombre: e.target.value })}
          className="input"
        />
        <input
          type="number"
          placeholder="Monto"
          value={nuevaDeuda.monto}
          onChange={(e) => setNuevaDeuda({ ...nuevaDeuda, monto: e.target.value })}
          className="input"
        />
        <input
          type="number"
          placeholder="Interés anual %"
          value={nuevaDeuda.interes}
          onChange={(e) => setNuevaDeuda({ ...nuevaDeuda, interes: e.target.value })}
          className="input"
        />
        <input
          type="number"
          placeholder="Cuotas"
          value={nuevaDeuda.cuotas}
          onChange={(e) => setNuevaDeuda({ ...nuevaDeuda, cuotas: e.target.value })}
          className="input"
        />
        <button onClick={agregarDeuda} className="btn btn-agregar">Agregar</button>
      </div>

      {/* Listas con botón eliminar */}
      <div className="listas">
        <h2>Ingresos</h2>
        <ul>
          {ingresos.map((ingreso, index) => (
            <li key={index} className="lista-item">
              <span>{ingreso.origen}: ${ingreso.monto.toFixed(2)}</span>
              <button onClick={() => eliminarIngreso(index)} className="btn btn-eliminar">Eliminar</button>
            </li>
          ))}
        </ul>
      </div>

      <div className="listas">
        <h2>Gastos</h2>
        <ul>
          {gastos.map((gasto, index) => (
            <li key={index} className="lista-item">
              <span>{gasto.categoria}: ${gasto.monto.toFixed(2)}</span>
              <button onClick={() => eliminarGasto(index)} className="btn btn-eliminar">Eliminar</button>
            </li>
          ))}
        </ul>
      </div>

      <div className="listas">
        <h2>Deudas</h2>
        <ul>
          {deudas.map((deuda, index) => (
            <li key={index} className="lista-item">
              <span>
                {deuda.nombre}: ${deuda.monto.toFixed(2)} - {deuda.cuotas} cuotas a {deuda.interes}%
              </span>
              <button onClick={() => eliminarDeuda(index)} className="btn btn-eliminar">Eliminar</button>
            </li>
          ))}
        </ul>
      </div>

      {/* Resultados simulador bola de nieve */}
      <div className="resultados">
        <h2>Proyección Pago de Deudas (Bola de Nieve)</h2>
        {detalle.length === 0 ? (
          <p>No hay deudas o saldo disponible para pagos.</p>
        ) : (
          <div className="detalle-meses">
            {detalle.map((mes, idx) => (
              <div key={idx} className="mes-item">
                <strong>Mes {mes.mes}:</strong> Pago total: ${mes.totalPagado.toFixed(2)}
                <ul>
                  {mes.pagos.map((pago, i) => (
                    <li key={i}>
                      {pago.nombre}: pagó ${pago.pago}, saldo restante ${pago.saldoRestante},{" "}
                      {pago.cuotasRestantes > 0
                        ? `cuotas restantes: ${pago.cuotasRestantes}`
                        : "deuda saldada"}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {Object.keys(resumen).length > 0 && (
          <div className="resumen-deudas">
            <h3>Resumen de pago por deuda:</h3>
            <ul>
              {Object.entries(resumen).map(([nombre, meses]) => (
                <li key={nombre}>
                  {nombre} será saldada en {meses} {meses === 1 ? "mes" : "meses"}.
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}