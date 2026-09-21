import {redirect} from "next/navigation";
import {getAdminSession} from "../../lib/admin-auth";
import {listDiscountCodes, type DiscountCode} from "../../lib/discount-store";
import {AdminDeleteButton} from "../components/admin-delete-button";
import {AdminFrame, AdminPageHeader, EmptyState, MetricCard} from "../components/admin-ui";

export const dynamic = "force-dynamic";

function DiscountFields({discount}: {discount?: DiscountCode}) {
  return <div className="adminRecordGrid adminDiscountFields">
    <label>Code<input name="code" required minLength={3} maxLength={32} pattern="[A-Za-z0-9]{3,32}" defaultValue={discount?.code} placeholder="WELCOME10" autoComplete="off"/></label>
    <label>Percentage off<input name="percentOff" type="number" required min="1" max="99" step="1" defaultValue={discount?.percentOff ?? 10}/></label>
    <label className="adminCheckField"><input name="active" type="checkbox" defaultChecked={discount?.active ?? true}/>Available at checkout</label>
  </div>;
}

function updateMessage(value?: string) {
  if (value === "created") return "Discount code created and ready for checkout.";
  if (value === "saved") return "Discount code updated.";
  if (value === "deleted") return "Discount code removed from the active catalogue.";
  if (value === "duplicate") return "That code already exists. Choose another alphanumeric code.";
  if (value === "invalid") return "Check the code and percentage, then try again.";
  return "That change could not be saved.";
}

export default async function DiscountsAdminPage({searchParams}: {searchParams: Promise<{update?: string}>}) {
  const session = await getAdminSession("discounts:read");
  if (!session) redirect("/admin/login");
  const [discounts, query] = await Promise.all([listDiscountCodes(), searchParams]);
  const active = discounts.filter((discount) => discount.active);
  const average = active.length ? Math.round(active.reduce((sum, discount) => sum + discount.percentOff, 0) / active.length) : 0;

  return <AdminFrame active="/admin/discounts" session={session}>
    <AdminPageHeader eyebrow="Checkout controls" title="Discount codes." description="Create and manage private promotional codes. Each code discounts the food subtotal; delivery remains unchanged."/>
    {query.update && <p className={`adminAlert ${["created", "saved", "deleted"].includes(query.update) ? "isSuccess" : "isError"}`}>{updateMessage(query.update)}</p>}
    <section className="adminMetrics">
      <MetricCard label="Active codes" value={active.length} detail="Currently accepted at checkout" tone={active.length ? "good" : undefined}/>
      <MetricCard label="Paused codes" value={discounts.length - active.length} detail="Retained but not accepted"/>
      <MetricCard label="Average saving" value={`${average}%`} detail="Across active codes"/>
      <MetricCard label="Code format" value="A–Z · 0–9" detail="3 to 32 characters"/>
    </section>
    <section className="adminPanel">
      <details className="adminCreateRecord">
        <summary>Create a discount code</summary>
        <form className="adminRecordForm" method="post" action="/api/admin/discounts">
          <input type="hidden" name="csrf" value={session.csrfToken}/>
          <DiscountFields/>
          <button className="adminButton" type="submit">Create code</button>
        </form>
      </details>
    </section>
    <section className="adminPanel">
      <div className="adminPanelHeading"><div><p>Private code catalogue</p><h2>Available promotions</h2></div><span>{discounts.length} code{discounts.length === 1 ? "" : "s"}</span></div>
      {!discounts.length ? <EmptyState title="No discount codes" detail="Create the first code above when you are ready to run a promotion."/> : <div className="adminTableWrap"><table className="adminOrdersTable adminDiscountTable">
        <thead><tr><th>Code</th><th>Saving</th><th>Status</th><th>Last updated</th><th><span className="srOnly">Actions</span></th></tr></thead>
        <tbody>{discounts.map((discount) => <tr key={discount.id}>
          <td data-label="Code"><strong className="adminDiscountCode">{discount.code}</strong><small>Food subtotal only</small></td>
          <td data-label="Saving"><strong>{discount.percentOff}%</strong></td>
          <td data-label="Status"><span className={`adminContentState ${discount.active ? "isLive" : "isPaused"}`}>{discount.active ? "Active" : "Paused"}</span></td>
          <td data-label="Last updated">{discount.updatedAt.slice(0, 10)}</td>
          <td data-label="Actions"><div className="adminEntryActions adminRecordActions" role="group" aria-label={`Actions for discount code ${discount.code}`}>
            <details className="adminEditRecord"><summary>Edit</summary><form className="adminRecordForm" method="post" action={`/api/admin/discounts/${discount.id}`}><input type="hidden" name="csrf" value={session.csrfToken}/><DiscountFields discount={discount}/><button className="adminButton" type="submit">Save code</button></form></details>
            <form method="post" action={`/api/admin/discounts/${discount.id}`}><input type="hidden" name="csrf" value={session.csrfToken}/><input type="hidden" name="action" value="delete"/><AdminDeleteButton confirmMessage={`Delete discount code ${discount.code}? It will stop working immediately, while existing orders retain their applied discount.`}/></form>
          </div></td>
        </tr>)}</tbody>
      </table></div>}
    </section>
  </AdminFrame>;
}
