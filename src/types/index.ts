import type { Prisma } from "@prisma/client";

export type TrainerWithProfile = Prisma.UserGetPayload<{
  include: {
    trainerProfile: {
      include: {
        clients: { include: { user: true } };
      };
    };
  };
}>;

export type ClientWithProfile = Prisma.UserGetPayload<{
  include: {
    clientProfile: {
      include: {
        trainer: { include: { user: true } };
        workoutPlans: true;
        progressLogs: true;
      };
    };
  };
}>;

export type WorkoutPlanWithDays = Prisma.WorkoutPlanGetPayload<{
  include: {
    workouts: {
      include: {
        exercises: { include: { exercise: true } };
      };
    };
  };
}>;

export type MessageWithUsers = Prisma.MessageGetPayload<{
  include: {
    sender: true;
    receiver: true;
    recommendation: { include: { product: true } };
  };
}>;

export type OrderWithItems = Prisma.OrderGetPayload<{
  include: {
    items: { include: { product: true } };
  };
}>;

export type EarningWithOrder = Prisma.TrainerEarningGetPayload<{
  include: {
    order: { include: { items: { include: { product: true } } } };
  };
}>;
