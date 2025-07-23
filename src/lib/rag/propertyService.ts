import { supabase } from '../supabaseClient';
import { Property } from './types';
import { processPropertyDocument } from './documentProcessor';
import { indexDocuments, updatePropertyDocuments, deletePropertyDocuments } from './vectorStore';

/**
 * Fetch all properties from Supabase
 * @returns Array of properties
 */
export async function getAllProperties(): Promise<Property[]> {
  try {
    const { data, error } = await supabase
      .from('developments')
      .select('id, content, flat_id, price')
      .order('id', { ascending: true });
    
    if (error) {
      throw new Error(`Error fetching properties: ${error.message}`);
    }
    
    return data as Property[];
  } catch (error) {
    console.error('Error in getAllProperties:', error);
    return [];
  }
}

/**
 * Fetch a property by ID
 * @param id The property ID
 * @returns The property or null if not found
 */
export async function getPropertyById(id: string): Promise<Property | null> {
  try {
    const { data, error } = await supabase
      .from('developments')
      .select('id, content, flat_id, price')
      .eq('id', id)
      .single();
    
    if (error) {
      throw new Error(`Error fetching property: ${error.message}`);
    }
    
    return data as Property;
  } catch (error) {
    console.error(`Error in getPropertyById for ID ${id}:`, error);
    return null;
  }
}

/**
 * Create a new property
 * @param property The property to create
 * @returns The created property
 */
export async function createProperty(property: Omit<Property, 'id'>): Promise<Property | null> {
  try {
    // Insert into Supabase
    const { data, error } = await supabase
      .from('developments')
      .insert([property])
      .select()
      .single();
    
    if (error) {
      throw new Error(`Error creating property: ${error.message}`);
    }
    
    const newProperty = data as Property;
    
    // Process and index the property for vector search
    const docs = await processPropertyDocument(newProperty);
    await indexDocuments(docs);
    
    return newProperty;
  } catch (error) {
    console.error('Error in createProperty:', error);
    return null;
  }
}

/**
 * Update an existing property
 * @param id The property ID
 * @param updates The property updates
 * @returns The updated property
 */
export async function updateProperty(
  id: string,
  updates: Partial<Omit<Property, 'id'>>
): Promise<Property | null> {
  try {
    // Update in Supabase
    const { data, error } = await supabase
      .from('developments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Error updating property: ${error.message}`);
    }
    
    const updatedProperty = data as Property;
    
    // Process and update the property in vector search
    const docs = await processPropertyDocument(updatedProperty);
    await updatePropertyDocuments(updatedProperty, docs);
    
    return updatedProperty;
  } catch (error) {
    console.error(`Error in updateProperty for ID ${id}:`, error);
    return null;
  }
}

/**
 * Delete a property
 * @param id The property ID
 * @returns True if successful, false otherwise
 */
export async function deleteProperty(id: string): Promise<boolean> {
  try {
    // Delete from Supabase
    const { error } = await supabase
      .from('developments')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(`Error deleting property: ${error.message}`);
    }
    
    // Delete from vector search
    await deletePropertyDocuments(id);
    
    return true;
  } catch (error) {
    console.error(`Error in deleteProperty for ID ${id}:`, error);
    return false;
  }
}

/**
 * Search for properties by text query
 * @param query The search query
 * @returns Array of matching properties
 */
export async function searchProperties(query: string): Promise<Property[]> {
  try {
    // This is a simple text search using Supabase
    // For more advanced search, use the vector search in vectorStore.ts
    const { data, error } = await supabase
      .from('developments')
      .select('id, content, flat_id, price')
      .textSearch('content', query);
    
    if (error) {
      throw new Error(`Error searching properties: ${error.message}`);
    }
    
    return data as Property[];
  } catch (error) {
    console.error(`Error in searchProperties for query "${query}":`, error);
    return [];
  }
}

/**
 * Reindex all properties in the vector store
 * @returns True if successful, false otherwise
 */
export async function reindexAllProperties(): Promise<boolean> {
  try {
    const properties = await getAllProperties();
    
    for (const property of properties) {
      const docs = await processPropertyDocument(property);
      await updatePropertyDocuments(property, docs);
    }
    
    return true;
  } catch (error) {
    console.error('Error in reindexAllProperties:', error);
    return false;
  }
}

/**
 * Get a summary of available properties, including typologies and price range
 * @returns A summary string or null if no properties are available
 */
export async function getAvailablePropertiesSummary(): Promise<string | null> {
  try {
    const properties = await getAllProperties();
    if (properties.length === 0) {
      return null;
    }

    const typologies = new Set<string>();
    let minPrice = Infinity;
    let maxPrice = 0;

    properties.forEach(property => {
      // Attempt to parse typology from the content if available
      if (property.content) {
        const contentData = JSON.parse(property.content);
        if (contentData.typology) {
          typologies.add(contentData.typology);
        }
      }

      if (property.price) {
        if (property.price < minPrice) {
          minPrice = property.price;
        }
        if (property.price > maxPrice) {
          maxPrice = property.price;
        }
      }
    });

    const sortedTypologies = Array.from(typologies).sort();
    let summary = 'Temos as seguintes tipologias disponíveis: ' + sortedTypologies.join(', ') + '.';

    if (minPrice !== Infinity && maxPrice !== 0) {
      summary += ` Os preços variam entre ${minPrice.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })} e ${maxPrice.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}`;
    }

    return summary;
  } catch (error) {
    console.error('Error in getAvailablePropertiesSummary:', error);
    return 'Não foi possível obter um resumo das propriedades disponíveis.';
  }
}