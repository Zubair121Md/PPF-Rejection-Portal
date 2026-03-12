from datetime import date
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth.deps import get_current_user, require_roles, get_channel_filter_for_user
from ..database import get_db
from ..models import RejectionTicket, User, UserRole, Channel, TicketStatus
from ..schemas import TicketCreate, TicketRead, PaginatedTickets


router = APIRouter(prefix="/tickets", tags=["tickets"])


@router.post("", response_model=TicketRead, status_code=status.HTTP_201_CREATED)
async def create_ticket(
    payload: TicketCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.B2B, UserRole.B2C)),
):
    if current_user.role == UserRole.B2B:
        channel = Channel.B2B
    elif current_user.role == UserRole.B2C:
        channel = Channel.B2C
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role for ticket creation")

    ticket = RejectionTicket(
        product_name=payload.product_name,
        quantity=payload.quantity,
        cost=payload.cost,
        reason=payload.reason,
        delivery_batch=payload.delivery_batch,
        delivery_date=payload.delivery_date,
        channel=channel,
        status=TicketStatus.PENDING,
        photo_proof_url=payload.photo_proof_url,
        created_by=current_user.id,
    )
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)
    return ticket


@router.get("", response_model=PaginatedTickets)
async def list_tickets(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    status_filter: Optional[TicketStatus] = Query(None, alias="status"),
    from_date: Optional[date] = Query(None),
    to_date: Optional[date] = Query(None),
    channel: Optional[Channel] = Query(None),
    skip: int = 0,
    limit: int = 20,
):
    query = select(RejectionTicket)
    count_query = select(func.count(RejectionTicket.id))

    channel_filter = get_channel_filter_for_user(current_user)
    if channel_filter:
        query = query.where(RejectionTicket.channel == channel_filter)
        count_query = count_query.where(RejectionTicket.channel == channel_filter)
    elif channel:
        query = query.where(RejectionTicket.channel == channel)
        count_query = count_query.where(RejectionTicket.channel == channel)

    if status_filter:
        query = query.where(RejectionTicket.status == status_filter)
        count_query = count_query.where(RejectionTicket.status == status_filter)

    if from_date:
        query = query.where(RejectionTicket.delivery_date >= from_date)
        count_query = count_query.where(RejectionTicket.delivery_date >= from_date)

    if to_date:
        query = query.where(RejectionTicket.delivery_date <= to_date)
        count_query = count_query.where(RejectionTicket.delivery_date <= to_date)

    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    query = query.order_by(RejectionTicket.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    tickets = result.scalars().unique().all()

    # Build Pydantic models manually to avoid lazy-loading relationships
    # (which would trigger MissingGreenlet errors in async context).
    ticket_items = [
        TicketRead(
            id=t.id,
            product_name=t.product_name,
            quantity=t.quantity,
            cost=t.cost,
            reason=t.reason,
            delivery_batch=t.delivery_batch,
            delivery_date=t.delivery_date,
            photo_proof_url=t.photo_proof_url,
            channel=t.channel,
            status=t.status,
            created_by=t.created_by,
            created_at=t.created_at,
            creator=None,  # Skip nested creator to keep things simple and non-lazy
        )
        for t in tickets
    ]

    return PaginatedTickets(items=ticket_items, total=total)


@router.get("/{ticket_id}", response_model=TicketRead)
async def get_ticket(
    ticket_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(RejectionTicket).where(RejectionTicket.id == ticket_id)
    channel_filter = get_channel_filter_for_user(current_user)
    if channel_filter:
        query = query.where(RejectionTicket.channel == channel_filter)

    result = await db.execute(query)
    ticket = result.scalars().first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    return ticket


@router.patch("/{ticket_id}", response_model=TicketRead)
async def update_ticket(
    ticket_id: UUID,
    payload: TicketCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    result = await db.execute(select(RejectionTicket).where(RejectionTicket.id == ticket_id))
    ticket = result.scalars().first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")

    ticket.product_name = payload.product_name
    ticket.quantity = payload.quantity
    ticket.cost = payload.cost
    ticket.reason = payload.reason
    ticket.delivery_batch = payload.delivery_batch
    ticket.delivery_date = payload.delivery_date
    ticket.photo_proof_url = payload.photo_proof_url

    await db.commit()
    await db.refresh(ticket)
    return ticket


@router.delete("/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ticket(
    ticket_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN)),
):
    result = await db.execute(select(RejectionTicket).where(RejectionTicket.id == ticket_id))
    ticket = result.scalars().first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")

    await db.delete(ticket)
    await db.commit()
    return None

