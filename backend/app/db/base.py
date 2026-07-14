# Import all database models in a central registry file
# so that Base.metadata has them registered before create_all() runs.
from app.db.base_class import Base  # noqa
from app.models.user import User  # noqa
from app.models.workspace import Workspace, WorkspaceMember  # noqa
from app.models.whatsapp import WhatsAppConnection, Conversation, Message  # noqa
from app.models.workflow import Workflow, WorkflowTrigger, WorkflowCondition, WorkflowAction, WorkflowExecutionLog, ScheduledJob, WorkflowNode, WorkflowEdge, WorkflowVersion  # noqa
