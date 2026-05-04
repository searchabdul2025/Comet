/**
 * Utility functions for filtering agent-visible data
 * Agents can only see customer names, all other fields are hidden
 */

/**
 * Identifies which field represents the customer name
 * Looks for common field names that indicate customer/contact name
 */
export function identifyCustomerNameField(fields: Array<{ id: string; name: string; type: string }>): string | null {
  if (!fields || fields.length === 0) return null;

  // Common patterns for customer name fields
  const namePatterns = [
    /^name$/i,
    /^customer\s*name$/i,
    /^client\s*name$/i,
    /^contact\s*name$/i,
    /^full\s*name$/i,
    /^customer$/i,
    /^client$/i,
    /^contact$/i,
    /^person\s*name$/i,
  ];

  // First, try to find a field matching name patterns
  for (const field of fields) {
    if (namePatterns.some(pattern => pattern.test(field.name))) {
      return field.id;
    }
  }

  // If no pattern match, use the first text field as fallback
  const firstTextField = fields.find(f => f.type === 'text');
  if (firstTextField) {
    return firstTextField.id;
  }

  // Last resort: use the first field
  return fields[0]?.id || null;
}

/**
 * Filters form data to only include customer name field for agents
 * All other fields are hidden for privacy
 */
export function filterAgentVisibleData(
  formData: Record<string, any>,
  fields: Array<{ id: string; name: string; type: string }>
): { customerName: string | null; customerNameField: string | null } {
  if (!formData || !fields || fields.length === 0) {
    return { customerName: null, customerNameField: null };
  }

  const customerNameFieldId = identifyCustomerNameField(fields);
  if (!customerNameFieldId) {
    return { customerName: null, customerNameField: null };
  }

  const customerName = formData[customerNameFieldId] || null;
  return {
    customerName: customerName ? String(customerName).trim() : null,
    customerNameField: customerNameFieldId,
  };
}

/**
 * Checks if a field should be visible to agents
 * Only customer name field is visible
 */
export function isFieldVisibleToAgent(
  fieldId: string,
  fields: Array<{ id: string; name: string; type: string }>
): boolean {
  const customerNameFieldId = identifyCustomerNameField(fields);
  return fieldId === customerNameFieldId;
}

