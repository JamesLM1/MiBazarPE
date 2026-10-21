import {getSupabaseServerClient} from '@/infrastructure/supabase/server';
import styles from './operations.module.css';
export async function ProductMovements({business,product}:{business:string;product:string}){
 const db=await getSupabaseServerClient();const {data,error}=await db.from('movimientos_inventario').select('id_movimiento,fecha,tipo,cantidad,stock_anterior,stock_resultante,motivo').eq('id_bazar',business).eq('id_producto',product).order('fecha',{ascending:false}).order('id_movimiento').limit(20);
 if(error)return <p role="alert" className={styles.error}>No se pudo consultar el historial de existencias.</p>;
 return <section className={styles.tableCard}><div className={styles.tableBar}><h2>Movimientos de inventario</h2><p>Últimos 20 movimientos de este producto</p></div>{data.length?<div className={styles.tableScroll}><table><thead><tr><th>Fecha</th><th>Operación</th><th>Unidades</th><th>Antes</th><th>Después</th><th>Motivo</th></tr></thead><tbody>{data.map(m=><tr key={m.id_movimiento}><td>{new Intl.DateTimeFormat('es-PE',{timeZone:'America/Lima',dateStyle:'short'}).format(new Date(m.fecha))}</td><td>{m.tipo}</td><td>{m.cantidad}</td><td>{m.stock_anterior}</td><td>{m.stock_resultante}</td><td>{m.motivo}</td></tr>)}</tbody></table></div>:<p className={styles.noRows}>Aún no hay movimientos. Registra una compra para ingresar existencias.</p>}</section>;
}
