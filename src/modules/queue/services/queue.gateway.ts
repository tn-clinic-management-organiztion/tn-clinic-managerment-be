/**
 * QUEUE GATEWAY - Xử lý WebSocket cho hệ thống hàng chờ
 * 
 * Các room quan trọng:
 * - `room_{room_id}` : Theo dõi hàng chờ của 1 phòng cụ thể
 * - `all_rooms` : Theo dõi tất cả các phòng (dashboard tổng)
 */

import { Logger } from "@nestjs/common";
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";


@WebSocketGateway({
  cors: {
    origin: "*",
  },
  namespace: 'queue'
})
export class QueueGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(QueueGateway.name);

  private connectedClients = new Map<string, Socket>();

  handleConnection(client: Socket) {
    this.connectedClients.set(client.id, client);
    this.logger.log(`Client queue connected: ${client.id}`);
    this.logger.log(`Total queue clients: ${this.connectedClients.size}`);
  }

    handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    this.logger.log(`Client queue disconnected: ${client.id}`);
    this.logger.log(`Total queue clients: ${this.connectedClients.size}`);
  }

    /**
   * Client join vào room để theo dõi 1 phòng cụ thể
   * 
   * @example
   * // Frontend gửi:
   * socket.emit('join_room', { roomId: 1 })
   */
  @SubscribeMessage('join_room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: number },
  ) {
    const roomName = `room_${data.roomId}`;
    client.join(roomName);
    this.logger.log(`Client ${client.id} joined ${roomName}`);
    
    client.emit('joined_room', {
      success: true,
      roomId: data.roomId,
      message: `Joined room ${data.roomId}`,
    });
  }

    /**
   * Client rời khỏi room
   */
  @SubscribeMessage('leave_room')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: number },
  ) {
    const roomName = `room_${data.roomId}`;
    client.leave(roomName);
    this.logger.log(`Client ${client.id} left ${roomName}`);
  }

  // ==================== SERVER EMIT METHODS ====================
  // Các method này được gọi từ QueueService

  /**
   * Emit khi có ticket mới được tạo
   * → Gửi đến: room cụ thể + all_rooms
   */
  emitTicketCreated(roomId: number, ticket: any) {
    this.server.to(`room_${roomId}`).emit('ticket:created', ticket);
    this.server.to('all_rooms').emit('ticket:created', ticket);
    this.logger.log(`Emitted ticket:created for room ${roomId}`);
  }

  /**
   * Emit khi ticket được gọi (WAITING → CALLED)
   */
  emitTicketCalled(roomId: number, ticket: any) {
    this.server.to(`room_${roomId}`).emit('ticket:called', ticket);
    this.server.to('all_rooms').emit('ticket:called', ticket);
    this.logger.log(`Emitted ticket:called for room ${roomId}`);
  }

  /**
   * Emit khi ticket bắt đầu phục vụ (CALLED → IN_PROGRESS)
   */
  emitTicketStarted(roomId: number, ticket: any) {
    this.server.to(`room_${roomId}`).emit('ticket:started', ticket);
    this.server.to('all_rooms').emit('ticket:started', ticket);
    this.logger.log(`Emitted ticket:started for room ${roomId}`);
  }

  /**
   * Emit khi ticket hoàn thành (IN_PROGRESS → COMPLETED)
   */
  emitTicketCompleted(roomId: number, ticket: any) {
    this.server.to(`room_${roomId}`).emit('ticket:completed', ticket);
    this.server.to('all_rooms').emit('ticket:completed', ticket);
    this.logger.log(`Emitted ticket:completed for room ${roomId}`);
  }

  /**
   * Emit khi ticket bị skip
   */
  emitTicketSkipped(roomId: number, ticket: any) {
    this.server.to(`room_${roomId}`).emit('ticket:skipped', ticket);
    this.server.to('all_rooms').emit('ticket:skipped', ticket);
    this.logger.log(`Emitted ticket:skipped for room ${roomId}`);
  }

  /**
   * Emit khi ticket được cập nhật (thay đổi status, assign services...)
   */
  emitTicketUpdated(roomId: number, ticket: any) {
    this.server.to(`room_${roomId}`).emit('ticket:updated', ticket);
    this.server.to('all_rooms').emit('ticket:updated', ticket);
    this.logger.log(`Emitted ticket:updated for room ${roomId}`);
  }

  /**
   * Emit thống kê real-time cho room
   */
  emitRoomStats(roomId: number, stats: any) {
    this.server.to(`room_${roomId}`).emit('room:stats', stats);
    this.server.to('all_rooms').emit('room:stats', stats);
  }

  /**
   * Broadcast message tới tất cả clients
   */
  broadcastMessage(event: string, data: any) {
    this.server.emit(event, data);
  }
}